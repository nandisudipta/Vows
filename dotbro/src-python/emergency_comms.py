import sys
import os
import socket
import json
import sqlite3
import hashlib
import hmac
import time
import uuid
from threading import Thread

# Secure Hash-based Stream Cipher (CTR-like) for zero-dependency E2E encryption
def derive_key(psk: str, salt: bytes) -> bytes:
    # Use PBKDF2-HMAC-SHA256 for key derivation
    return hashlib.pbkdf2_hmac('sha256', psk.encode('utf-8'), salt, 1000, 32)

def encrypt(data: str, psk: str) -> tuple:
    salt = os.urandom(16)
    key = derive_key(psk, salt)
    plaintext = data.encode('utf-8')
    
    # Generate keystream using SHA256 in a CTR-like mode
    ciphertext = bytearray()
    chunk_size = 32
    for i in range(0, len(plaintext), chunk_size):
        # Keystream block = SHA256(key + salt + counter)
        counter = (i // chunk_size).to_bytes(4, 'big')
        keystream_block = hashlib.sha256(key + salt + counter).digest()
        
        chunk = plaintext[i:i+chunk_size]
        for j in range(len(chunk)):
            ciphertext.append(chunk[j] ^ keystream_block[j])
            
    ciphertext_bytes = bytes(ciphertext)
    # Compute HMAC-SHA256 over ciphertext + salt for authentication (Encrypt-then-MAC)
    mac = hmac.new(key, ciphertext_bytes + salt, hashlib.sha256).digest()
    return salt, mac, ciphertext_bytes

def decrypt(salt: bytes, mac: bytes, ciphertext: bytes, psk: str) -> str:
    key = derive_key(psk, salt)
    
    # Verify HMAC before decrypting
    expected_mac = hmac.new(key, ciphertext + salt, hashlib.sha256).digest()
    if not hmac.compare_digest(mac, expected_mac):
        raise ValueError("Decryption failed: MAC verification failed (tampered payload)")
        
    plaintext = bytearray()
    chunk_size = 32
    for i in range(0, len(ciphertext), chunk_size):
        counter = (i // chunk_size).to_bytes(4, 'big')
        keystream_block = hashlib.sha256(key + salt + counter).digest()
        
        chunk = ciphertext[i:i+chunk_size]
        for j in range(len(chunk)):
            plaintext.append(chunk[j] ^ keystream_block[j])
            
    return plaintext.decode('utf-8')

# DB Helpers
def get_db_connection(db_path: str):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def get_setting(conn, key: str, default: str) -> str:
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
        row = cursor.fetchone()
        return row['value'] if row else default
    except Exception:
        return default

# Network Operations
def listen_loop(db_path: str, port: int, psk: str):
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    
    try:
        server.bind(('0.0.0.0', port))
        server.listen(5)
        print(f"[*] Emergency listener running on port {port}...", flush=True)
    except Exception as e:
        print(f"[!] Bind failed: {e}", flush=True)
        return

    while True:
        try:
            client, addr = server.accept()
            print(f"[*] Incoming connection from {addr[0]}", flush=True)
            
            # Read header: salt (16 bytes) + mac (32 bytes) + length (4 bytes)
            header = client.recv(52)
            if len(header) < 52:
                client.close()
                continue
                
            salt = header[:16]
            mac = header[16:48]
            payload_len = int.from_bytes(header[48:52], 'big')
            
            # Receive full ciphertext
            ciphertext = b""
            while len(ciphertext) < payload_len:
                chunk = client.recv(min(4096, payload_len - len(ciphertext)))
                if not chunk:
                    break
                ciphertext += chunk
                
            client.close()
            
            if len(ciphertext) != payload_len:
                print("[!] Incomplete transmission received", flush=True)
                continue
                
            # Decrypt message
            try:
                decrypted_json = decrypt(salt, mac, ciphertext, psk)
                msg_data = json.loads(decrypted_json)
                print(f"[*] Decrypted payload successfully: {msg_data}", flush=True)
                
                # Write directly to SQLite database
                conn = get_db_connection(db_path)
                cursor = conn.cursor()
                
                conv_id = msg_data.get('conversation_id', 'emergency_broadcast')
                sender = msg_data.get('sender_name', 'Secured Peer')
                content = msg_data.get('content', '')
                
                # Ensure conversation exists
                cursor.execute("SELECT id FROM conversations WHERE id = ?", (conv_id,))
                if not cursor.fetchone():
                    now = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())
                    cursor.execute(
                        "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
                        (conv_id, f"Emergency: {sender}", now, now)
                    )
                
                # Insert message
                msg_id = str(uuid.uuid4())
                now = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())
                cursor.execute(
                    "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
                    (msg_id, conv_id, 'assistant', content, now)
                )
                
                # Update conversation time
                cursor.execute(
                    "UPDATE conversations SET updated_at = ? WHERE id = ?",
                    (now, conv_id)
                )
                
                conn.commit()
                conn.close()
                print("[*] Successfully recorded secure message to DB.", flush=True)
                
            except Exception as e:
                print(f"[!] Handshake/Decryption error from {addr[0]}: {e}", flush=True)
                
        except Exception as e:
            print(f"[!] Socket accept loop error: {e}", flush=True)
            time.sleep(1)

def send_message(peer_ip: str, port: int, psk: str, sender_name: str, content: str, conversation_id: str) -> bool:
    try:
        # Create packet payload
        payload = {
            "conversation_id": conversation_id,
            "sender_name": sender_name,
            "content": content,
            "timestamp": time.time()
        }
        
        serialized = json.dumps(payload)
        salt, mac, ciphertext = encrypt(serialized, psk)
        
        # Prepare header: salt (16) + mac (32) + payload length (4)
        payload_len = len(ciphertext).to_bytes(4, 'big')
        packet = salt + mac + payload_len + ciphertext
        
        # Connect and send
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(5.0)
        s.connect((peer_ip, port))
        s.sendall(packet)
        s.close()
        print(f"[*] Emergency transmission successfully sent to {peer_ip}:{port}", flush=True)
        return True
    except Exception as e:
        print(f"[!] Failed to transmit to {peer_ip}:{port} - {e}", flush=True)
        return False

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 emergency_comms.py <db_path> <mode> [args]")
        print("Modes:")
        print("  listen")
        print("  send <target_ip> <sender_name> <content> <conversation_id>")
        sys.exit(1)
        
    db_path = sys.argv[1]
    mode = sys.argv[2]
    
    # Read settings from SQLite
    conn = get_db_connection(db_path)
    psk = get_setting(conn, "emergency_psk", "dotbro_default_secure_passphrase_2026")
    port_str = get_setting(conn, "emergency_port", "8765")
    conn.close()
    
    try:
        port = int(port_str)
    except ValueError:
        port = 8765
        
    if mode == "listen":
        # Keep listener alive in main thread
        try:
            listen_loop(db_path, port, psk)
        except KeyboardInterrupt:
            print("\n[*] Shutting down secure listener.", flush=True)
            
    elif mode == "send":
        if len(sys.argv) < 7:
            print("Usage: python3 emergency_comms.py <db_path> send <target_ip> <sender_name> <content> <conversation_id>")
            sys.exit(1)
            
        target_ip = sys.argv[3]
        sender_name = sys.argv[4]
        content = sys.argv[5]
        conversation_id = sys.argv[6]
        
        success = send_message(target_ip, port, psk, sender_name, content, conversation_id)
        sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
