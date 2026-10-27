import { useState, useEffect } from 'react';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { menuAPI } from '../api/api';

function MenuManagement() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State for Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    mealType: 'breakfast',
    date: new Date().toISOString().split('T')[0],
    itemsText: '',
    price: 50,
    capacity: 100,
    isAvailable: true,
  });

  const fetchMenus = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await menuAPI.getTodayMenus();
      setMenus(data.menus || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch menus.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const openCreateModal = () => {
    setEditingMenuId(null);
    setFormData({
      mealType: 'breakfast',
      date: new Date().toISOString().split('T')[0],
      itemsText: '',
      price: 50,
      capacity: 100,
      isAvailable: true,
    });
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (menu) => {
    setEditingMenuId(menu._id);
    setFormData({
      mealType: menu.mealType,
      date: menu.date ? new Date(menu.date).toISOString().split('T')[0] : '',
      itemsText: menu.items ? menu.items.join(', ') : '',
      price: menu.price,
      capacity: menu.capacity,
      isAvailable: menu.isAvailable,
    });
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Parse items from comma-separated string
    const itemsArray = formData.itemsText
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (itemsArray.length === 0) {
      setError('Please provide at least one food dish item.');
      setSubmitting(false);
      return;
    }

    try {
      if (editingMenuId) {
        // Update existing menu
        await menuAPI.updateMenu(editingMenuId, {
          mealType: formData.mealType,
          items: itemsArray,
          price: Number(formData.price),
          capacity: Number(formData.capacity),
          isAvailable: formData.isAvailable,
        });
        setSuccess('Menu item updated successfully.');
      } else {
        // Create new menu
        await menuAPI.createMenu({
          mealType: formData.mealType,
          date: formData.date,
          items: itemsArray,
          price: Number(formData.price),
          capacity: Number(formData.capacity),
        });
        setSuccess('New meal menu created and published successfully.');
      }

      setIsModalOpen(false);
      fetchMenus();
    } catch (err) {
      setError(err.message || 'Operation failed. A menu for this meal & date might already exist.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu? Note: Menus with existing reservations cannot be deleted.')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await menuAPI.deleteMenu(id);
      setSuccess('Menu item deleted successfully.');
      fetchMenus();
    } catch (err) {
      setError(err.message || 'Failed to delete menu.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Refectory Menu Management</h1>
          <p className="page-subtitle">
            Create, update, or remove daily meal slots, dish lists, and capacity limits.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateModal}
        >
          + Add New Menu Slot
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <Loading message="Fetching refectory menus..." />
      ) : menus.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No menus published for today"
          description="Click the '+ Add New Menu Slot' button above to configure breakfast, lunch, or dinner for campus students."
        />
      ) : (
        <div className="grid grid-cols-3">
          {menus.map((menu) => {
            const remaining = menu.capacity - menu.bookedCount;
            return (
              <div key={menu._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className={`meal-badge meal-${menu.mealType}`}>
                    {menu.mealType}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary-dark)' }}>
                    ₹{menu.price}
                  </span>
                </div>

                <div style={{ flex: 1, marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    DISHES:
                  </div>
                  <div className="menu-items-list">
                    {menu.items && menu.items.map((item, idx) => (
                      <span key={idx} className="menu-item-tag">
                        {item}
                      </span>
                    ))}
                  </div>

                  <div style={{ marginTop: '16px', padding: '10px', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Capacity: <strong>{menu.capacity}</strong></span>
                    <span>Booked: <strong>{menu.bookedCount}</strong></span>
                    <span style={{ color: remaining <= 0 ? 'var(--danger)' : 'var(--success)' }}>
                      Available: <strong>{remaining}</strong>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => openEditModal(menu)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ color: 'var(--danger)', borderColor: '#fca5a5' }}
                    onClick={() => handleDelete(menu._id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMenuId ? "Edit Menu Slot" : "Create New Meal Menu"}
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="mealType">Meal Type:</label>
            <select
              id="mealType"
              name="mealType"
              value={formData.mealType}
              onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
              className="form-select"
              required
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>

          {!editingMenuId && (
            <div className="form-group">
              <label className="form-label" htmlFor="date">Scheduled Date:</label>
              <input
                id="date"
                type="date"
                name="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="form-input"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="itemsText">
              Dishes & Food Items (separate with commas):
            </label>
            <textarea
              id="itemsText"
              name="itemsText"
              rows="3"
              value={formData.itemsText}
              onChange={(e) => setFormData({ ...formData, itemsText: e.target.value })}
              placeholder="e.g. Masala Dosa, Sambar, Coconut Chutney, Coffee"
              className="form-textarea"
              required
            />
            <span className="form-hint">
              Example: Dal Makhani, Paneer Butter Masala, Jeera Rice, Gulab Jamun
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="price">Price (₹ INR):</label>
              <input
                id="price"
                type="number"
                min="0"
                step="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="capacity">Max Serving Capacity:</label>
              <input
                id="capacity"
                type="number"
                min="1"
                step="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="form-input"
                required
              />
            </div>
          </div>

          {editingMenuId && (
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="isAvailable"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              />
              <label htmlFor="isAvailable" style={{ fontSize: '13px', fontWeight: '500' }}>
                Menu is Active & Available for Booking
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : editingMenuId ? 'Save Changes' : 'Publish Menu'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default MenuManagement;
