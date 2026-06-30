import React, { useEffect, useState } from 'react';
import { useContactsStore } from '../../stores/contacts.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Trash } from '../../components/ui/Icons';
import '../../styles/views/contacts.css';

export const ContactsView: React.FC = () => {
  const {
    contacts,
    searchQuery,
    isLoading,
    loadContacts,
    searchContacts,
    createContact,
    updateContact,
    deleteContact,
  } = useContactsStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setOrganization('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contact: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(contact.id);
    setFirstName(contact.first_name);
    setLastName(contact.last_name || '');
    setEmail(contact.email || '');
    setPhone(contact.phone || '');
    setOrganization(contact.organization || '');
    setNotes(contact.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return;

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      organization: organization.trim(),
      notes: notes.trim(),
    };

    if (editingId) {
      await updateContact(editingId, payload);
    } else {
      await createContact(payload);
    }

    setIsModalOpen(false);
    loadContacts();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this contact?')) {
      await deleteContact(id);
      loadContacts();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    searchContacts(e.target.value);
  };

  return (
    <div className="contacts-view">
      <div className="contacts-header">
        <h2 className="contacts-header__title">Contacts</h2>
        <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={handleOpenAdd}>
          Add Contact
        </Button>
      </div>

      <div className="contacts-search">
        <Input
          placeholder="Search contacts..."
          icon={<Search size={18} />}
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="contacts-list">
        {isLoading ? (
          <div>Loading contacts...</div>
        ) : contacts.length > 0 ? (
          contacts.map((contact) => (
            <div key={contact.id} className="contact-card" onClick={(e) => handleOpenEdit(contact, e)}>
              <div className="contact-card__avatar">
                {contact.first_name.charAt(0).toUpperCase()}
                {contact.last_name ? contact.last_name.charAt(0).toUpperCase() : ''}
              </div>
              <div className="contact-card__info">
                <span className="contact-card__name">
                  {contact.first_name} {contact.last_name}
                </span>
                {contact.organization && <span className="contact-card__org">{contact.organization}</span>}
                <div className="contact-card__details">
                  {contact.email && <span className="contact-card__detail">✉ {contact.email}</span>}
                  {contact.phone && <span className="contact-card__detail">☎ {contact.phone}</span>}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="ghost" size="sm" onClick={(e) => handleDelete(contact.id, e)}>
                  <Trash size={14} />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No contacts found.
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Contact' : 'Add Contact'}
        actions={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="contact-form">
          <div className="contact-form__row">
            <Input label="First Name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Organization" value={organization} onChange={(e) => setOrganization(e.target.value)} />
          <div className="dotbro-input-group">
            <label className="dotbro-input-label">Notes</label>
            <textarea
              className="dotbro-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default ContactsView;
