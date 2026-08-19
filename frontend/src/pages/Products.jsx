import { useEffect, useMemo, useState } from "react";
import {
  History,
  PackagePlus,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  current_price: "",
  cost_price: "",
  stock_quantity: "",
  description: "",
  change_reason: "",
};

function Products() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("pricepilot_token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) =>
      [
        product.name,
        product.sku,
        product.category,
      ].some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
  }, [products, searchTerm]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      setError("");

      const response = await fetch(`${API_URL}/products`, {
        headers: authHeaders,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Could not load products."
        );
      }

      setProducts(data);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Could not load products."
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      category: formData.category.trim(),
      current_price: Number(formData.current_price),
      cost_price: Number(formData.cost_price),
      stock_quantity: Number(formData.stock_quantity),
      description:
        formData.description.trim() || null,
    };

    if (editingId) {
      payload.change_reason =
        formData.change_reason.trim() || null;
    }

    try {
      const response = await fetch(
        editingId
          ? `${API_URL}/products/${editingId}`
          : `${API_URL}/products`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Product save failed."
        );
      }

      setMessage(
        editingId
          ? "Product updated successfully."
          : "Product created successfully."
      );

      resetForm();
      await loadProducts();
    } catch (requestError) {
      setError(
        requestError.message ||
          "Product save failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);

    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      current_price: String(product.current_price),
      cost_price: String(product.cost_price),
      stock_quantity: String(product.stock_quantity),
      description: product.description || "",
      change_reason: "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteProduct = async (productId) => {
    const confirmed = window.confirm(
      "Delete this product permanently?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/products/${productId}`,
        {
          method: "DELETE",
          headers: authHeaders,
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Could not delete product."
        );
      }

      setMessage("Product deleted successfully.");
      await loadProducts();
    } catch (requestError) {
      setError(
        requestError.message ||
          "Could not delete product."
      );
    }
  };

  const loadHistory = async (product) => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/products/${product.id}/pricing-history`,
        {
          headers: authHeaders,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Could not load pricing history."
        );
      }

      setHistoryProduct(product);
      setHistory(data);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Could not load pricing history."
      );
    }
  };

  return (
    <main className="dashboard-content">
      <section className="hero-section">
        <div>
          <span className="eyebrow">
            Product management
          </span>

          <h1>Product Catalog</h1>

          <p>
            Create, update, search and manage products with
            automatic pricing-history tracking.
          </p>
        </div>
      </section>

      <section className="dashboard-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {editingId ? "Edit product" : "Add product"}
            </span>

            <h2>
              {editingId
                ? "Update catalog item"
                : "Create a catalog item"}
            </h2>
          </div>

          {editingId && (
            <button
              type="button"
              className="secondary-action"
              onClick={resetForm}
            >
              Cancel editing
            </button>
          )}
        </div>

        <form
          className="product-form"
          onSubmit={handleSubmit}
        >
          <label>
            <span>Product name</span>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span>SKU</span>
            <input
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span>Category</span>
            <input
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span>Current price</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              name="current_price"
              value={formData.current_price}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span>Cost price</span>
            <input
              type="number"
              min="0"
              step="0.01"
              name="cost_price"
              value={formData.cost_price}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span>Stock quantity</span>
            <input
              type="number"
              min="0"
              name="stock_quantity"
              value={formData.stock_quantity}
              onChange={handleChange}
              required
            />
          </label>

          <label className="product-form-wide">
            <span>Description</span>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
            />
          </label>

          {editingId && (
            <label className="product-form-wide">
              <span>Price-change reason</span>
              <input
                name="change_reason"
                value={formData.change_reason}
                onChange={handleChange}
                placeholder="Example: seasonal adjustment"
              />
            </label>
          )}

          <button
            type="submit"
            className="primary-action"
            disabled={loading}
          >
            <PackagePlus size={18} />

            {loading
              ? "Saving..."
              : editingId
                ? "Update product"
                : "Add product"}
          </button>
        </form>

        {error && (
          <div className="forecast-error">
            {error}
          </div>
        )}

        {message && (
          <div className="product-success">
            {message}
          </div>
        )}
      </section>

      <section className="dashboard-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              Catalog records
            </span>
            <h2>Products</h2>
          </div>

          <button
            type="button"
            className="secondary-action"
            onClick={loadProducts}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        <div className="product-search">
          <Search size={18} />

          <input
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search by name, SKU or category"
          />
        </div>

        {loadingProducts ? (
          <p>Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <div className="product-table-wrapper">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Cost</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{product.category}</td>
                    <td>
                      ₹{Number(
                        product.current_price
                      ).toFixed(2)}
                    </td>
                    <td>
                      ₹{Number(
                        product.cost_price
                      ).toFixed(2)}
                    </td>
                    <td>{product.stock_quantity}</td>
                    <td>
                      <div className="product-actions">
                        <button
                          type="button"
                          onClick={() =>
                            startEdit(product)
                          }
                          title="Edit"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            loadHistory(product)
                          }
                          title="Pricing history"
                        >
                          <History size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteProduct(product.id)
                          }
                          title="Delete"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {historyProduct && (
        <section className="dashboard-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                Price audit
              </span>

              <h2>
                {historyProduct.name} pricing history
              </h2>
            </div>

            <button
              type="button"
              className="secondary-action"
              onClick={() => {
                setHistoryProduct(null);
                setHistory([]);
              }}
            >
              Close
            </button>
          </div>

          {history.length === 0 ? (
            <p>No recorded price changes yet.</p>
          ) : (
            <div className="product-table-wrapper">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Old price</th>
                    <th>New price</th>
                    <th>Reason</th>
                    <th>Changed at</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        ₹{Number(
                          entry.old_price
                        ).toFixed(2)}
                      </td>
                      <td>
                        ₹{Number(
                          entry.new_price
                        ).toFixed(2)}
                      </td>
                      <td>
                        {entry.change_reason || "—"}
                      </td>
                      <td>
                        {new Date(
                          entry.changed_at
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default Products;