
import { useState, useEffect } from 'react'
import './App.css'

// Local backend URL
const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api/items';

const categories = [
  'Electronics',
  'Bags',
  'Accessories',
  'Other'
]

// Convert MongoDB item into the format used by our frontend
function formatItem(item) {
  return {
    id: item._id,
    name: item.title,
    location: item.location,
    description: item.description,
    status: item.status,
    category: item.category
  }
}

function App() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)

  const [formStatus, setFormStatus] = useState('Lost')
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Other')

  // Load saved items from MongoDB through the backend
  async function loadItems() {
    try {
      setError('')

      const response = await fetch(API_URL)

      if (!response.ok) {
        throw new Error('Could not load items')
      }

      const data = await response.json()
      setItems(data.map(formatItem))
    } catch (err) {
      setError('Could not connect to the backend. Please check the server.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  // Search and filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'All' || item.status === statusFilter

    const matchesCategory =
      categoryFilter === 'All' || item.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  // Open form for a new report
  function openForm(status) {
    setEditId(null)
    setFormStatus(status)
    setName('')
    setLocation('')
    setDescription('')
    setCategory('Other')
    setShowForm(true)
  }

  // Save a new report or update an existing report
  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const itemData = {
      title: name,
      location,
      description,
      status: formStatus,
      category
    }

    try {
      const url =
        editId !== null ? `${API_URL}/${editId}` : API_URL

      const response = await fetch(url, {
        method: editId !== null ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not save item')
      }

      await loadItems()

      setSearch('')
      setStatusFilter('All')
      setCategoryFilter('All')
      closeForm()
    } catch (err) {
      setError(err.message || 'Could not save item')
      console.error(err)
    }
  }

  // Open form with existing item details
  function handleEdit(item) {
    setEditId(item.id)
    setName(item.name)
    setLocation(item.location)
    setDescription(item.description)
    setFormStatus(item.status)
    setCategory(item.category)
    setShowForm(true)
  }

  // Delete a report from MongoDB
  async function handleDelete(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this report?'
    )

    if (!confirmed) return

    try {
      setError('')

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not delete item')
      }

      await loadItems()
    } catch (err) {
      setError(err.message || 'Could not delete item')
      console.error(err)
    }
  }

  // Close and reset the form
  function closeForm() {
    setShowForm(false)
    setEditId(null)
    setName('')
    setLocation('')
    setDescription('')
    setCategory('Other')
    setFormStatus('Lost')
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h2>FindIt</h2>

        <div className="nav-links">
          <a href="#">Home</a>
          <a href="#items">Browse Items</a>
          <a href="#report">Report Item</a>
        </div>
      </nav>

      <section className="hero">
        <h1>Lost Something? Find It Here.</h1>

        <p>
          Report lost belongings, find reported items,
          and help return them to their owners.
        </p>

        <input
          className="search-input"
          type="text"
          placeholder="Search by item name or location..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="buttons" id="report">
          <button onClick={() => openForm('Lost')}>
            Report Lost Item
          </button>

          <button onClick={() => openForm('Found')}>
            Report Found Item
          </button>
        </div>
      </section>

      {error && <p role="alert">{error}</p>}

      {showForm && (
        <section className="report-form">
          <h2>
            {editId !== null
              ? 'Edit Report'
              : `Report ${formStatus} Item`}
          </h2>

          <form onSubmit={handleSubmit}>
            <label>Item Name</label>
            <input
              type="text"
              placeholder="Enter item name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />

            <label>Category</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <label>Status</label>
            <select
              value={formStatus}
              onChange={(event) => setFormStatus(event.target.value)}
            >
              <option value="Lost">Lost</option>
              <option value="Found">Found</option>
            </select>

            <label>Location</label>
            <input
              type="text"
              placeholder="Where was it lost or found?"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              required
            />

            <label>Description</label>
            <textarea
              placeholder="Describe the item"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />

            <div className="buttons">
              <button type="submit">
                {editId !== null ? 'Update Report' : 'Submit Report'}
              </button>

              <button type="button" onClick={closeForm}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="items" id="items">
        <h2>Recently Reported Items</h2>

        <div className="filters">
          <div>
            <label>Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Lost">Lost</option>
              <option value="Found">Found</option>
            </select>
          </div>

          <div>
            <label>Filter by Category</label>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p>Showing {filteredItems.length} item(s)</p>

        <div className="item-list">
          {loading ? (
            <p>Loading items...</p>
          ) : filteredItems.length === 0 ? (
            <p>No items found. Try changing your search or filters.</p>
          ) : (
            filteredItems.map((item) => (
              <div className="item-card" key={item.id}>
                <span className={`status ${item.status.toLowerCase()}`}>
                  {item.status}
                </span>

                <h3>{item.name}</h3>
                <p><strong>Category:</strong> {item.category}</p>
                <p><strong>Location:</strong> {item.location}</p>
                <p>{item.description}</p>

                <div className="card-buttons">
                  <button onClick={() => handleEdit(item)}>
                    Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <footer>
        <p>FindIt — Helping lost belongings find their way home.</p>
      </footer>
    </div>
  )
}

export default App
