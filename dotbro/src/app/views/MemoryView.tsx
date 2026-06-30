import React, { useEffect, useState } from 'react';
import { useMemoryStore } from '../../stores/memory.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Trash } from '../../components/ui/Icons';
import '../../styles/views/memory.css';

type MemoryCategory =
  | 'note'
  | 'preference'
  | 'knowledge'
  | 'task'
  | 'relationship';

export const MemoryView: React.FC = () => {
  const {
    memories,
    activeCategory,
    searchQuery,
    isLoading,
    loadMemories,
    searchMemories,
    createMemory,
    updateMemory,
    deleteMemory,
    setCategory,
  } = useMemoryStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategoryInput] = useState<MemoryCategory>('note');
  const [tags, setTags] = useState('');
  const [source, setSource] = useState('');

  useEffect(() => {
    loadMemories(activeCategory);
  }, [loadMemories, activeCategory]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setCategoryInput('note');
    setTags('');
    setSource('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (memory: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(memory.id);
    setTitle(memory.title);
    setContent(memory.content);
    setCategoryInput(memory.category);
    setTags(memory.tags);
    setSource(memory.source || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const payload = {
      category,
      title: title.trim(),
      content: content.trim(),
      tags: tags.trim() || '[]',
      source: source.trim(),
    };

    if (editingId) {
      await updateMemory(editingId, payload);
    } else {
      await createMemory(payload);
    }

    setIsModalOpen(false);
    loadMemories();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this memory?')) {
      await deleteMemory(id);
      loadMemories();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    searchMemories(e.target.value);
  };

  const categories: (MemoryCategory | 'all')[] = ['all', 'note', 'preference', 'knowledge', 'task', 'relationship'];

  const handleCategorySelect = (cat: MemoryCategory | 'all') => {
    const nextCat = cat === 'all' ? null : cat;
    setCategory(nextCat);
    loadMemories(nextCat);
  };

  return (
    <div className="memory-view">
      <div className="memory-header">
        <h2 className="memory-header__title">Memory</h2>
        <Button variant="primary" size="md" icon={<Plus size={16} />} onClick={handleOpenAdd}>
          Add Memory
        </Button>
      </div>

      <div className="memory-search-bar">
        <Input
          placeholder="Search memory..."
          icon={<Search size={18} />}
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <div className="memory-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`memory-tab ${
                (cat === 'all' && activeCategory === null) || activeCategory === cat
                  ? 'memory-tab--active'
                  : ''
              }`}
              onClick={() => handleCategorySelect(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="memory-list">
        {isLoading ? (
          <div>Loading memory...</div>
        ) : memories.length > 0 ? (
          memories.map((mem) => (
            <div key={mem.id} className="memory-card" onClick={(e) => handleOpenEdit(mem, e)}>
              <div className="memory-card__header">
                <span className={`memory-card__badge memory-badge--${mem.category}`}>{mem.category}</span>
                <span className="memory-card__date">{new Date(mem.updated_at).toLocaleDateString()}</span>
              </div>
              <h3 className="memory-card__title">{mem.title}</h3>
              <p className="memory-card__content">{mem.content}</p>
              {mem.source && (
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Source: {mem.source}</span>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
                <div className="memory-card__tags">
                  {(() => {
                    try {
                      const tagsArray = JSON.parse(mem.tags);
                      return Array.isArray(tagsArray)
                        ? tagsArray.map((t: string) => (
                            <span key={t} className="memory-card__tag">
                              #{t}
                            </span>
                          ))
                        : null;
                    } catch {
                      return null;
                    }
                  })()}
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => handleDelete(mem.id, e)}>
                  <Trash size={14} />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No memories stored yet.
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Memory' : 'Add Memory'}
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
        <form onSubmit={handleSave} className="memory-form">
          <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="dotbro-input-group">
            <label className="dotbro-input-label">Category</label>
            <select
              className="settings-select"
              value={category}
              onChange={(e) => setCategoryInput(e.target.value as MemoryCategory)}
            >
              <option value="note">Note</option>
              <option value="preference">Preference</option>
              <option value="knowledge">Knowledge</option>
              <option value="task">Task</option>
              <option value="relationship">Relationship</option>
            </select>
          </div>
          <div className="dotbro-input-group">
            <label className="dotbro-input-label">Content</label>
            <textarea
              className="dotbro-input"
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
          <Input
            label="Tags (JSON Array format, e.g., [&quot;work&quot;,&quot;personal&quot;])"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder='["tag1", "tag2"]'
          />
          <Input label="Source (optional)" value={source} onChange={(e) => setSource(e.target.value)} />
        </form>
      </Modal>
    </div>
  );
};
export default MemoryView;
