import { motion } from "framer-motion";
import {
  Box,
  CalendarDays,
  Camera,
  Package,
  Ruler,
  Scale,
  Store,
  Truck,
} from "lucide-react";

const categories = [
  { label: "Electronics", value: 10 },
  { label: "Furniture", value: 20 },
  { label: "Home & Kitchen", value: 30 },
  { label: "Fashion", value: 40 },
  { label: "Sports", value: 50 },
  { label: "Beauty", value: 60 },
];

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function InputForm({
  formData,
  onChange,
  onSubmit,
  onReset,
  loading,
  error,
}) {
  return (
    <motion.section
      className="dashboard-card input-card"
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55 }}
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">Input parameters</span>
          <h2>Product details</h2>
          <p>Enter product and order information for prediction.</p>
        </div>

        <button type="button" className="reset-button" onClick={onReset}>
          Reset
        </button>
      </div>

      <form onSubmit={onSubmit}>
        <div className="input-grid">
          <label className="input-field">
            <span>Freight value</span>

            <div className="input-control">
              <Truck size={18} />

              <input
                type="number"
                step="any"
                min="0"
                name="freight_value"
                value={formData.freight_value}
                onChange={onChange}
                placeholder="20"
              />
            </div>
          </label>

          <label className="input-field">
            <span>Product weight (g)</span>

            <div className="input-control">
              <Scale size={18} />

              <input
                type="number"
                step="any"
                min="0"
                name="product_weight_g"
                value={formData.product_weight_g}
                onChange={onChange}
                placeholder="500"
              />
            </div>
          </label>

          <label className="input-field">
            <span>Length (cm)</span>

            <div className="input-control">
              <Ruler size={18} />

              <input
                type="number"
                step="any"
                min="0"
                name="product_length_cm"
                value={formData.product_length_cm}
                onChange={onChange}
                placeholder="20"
              />
            </div>
          </label>

          <label className="input-field">
            <span>Height (cm)</span>

            <div className="input-control">
              <Ruler size={18} />

              <input
                type="number"
                step="any"
                min="0"
                name="product_height_cm"
                value={formData.product_height_cm}
                onChange={onChange}
                placeholder="10"
              />
            </div>
          </label>

          <label className="input-field">
            <span>Width (cm)</span>

            <div className="input-control">
              <Box size={18} />

              <input
                type="number"
                step="any"
                min="0"
                name="product_width_cm"
                value={formData.product_width_cm}
                onChange={onChange}
                placeholder="15"
              />
            </div>
          </label>

          <label className="input-field">
            <span>Product photos</span>

            <div className="input-control">
              <Camera size={18} />

              <input
                type="number"
                min="0"
                name="product_photos_qty"
                value={formData.product_photos_qty}
                onChange={onChange}
                placeholder="3"
              />
            </div>
          </label>

          <label className="input-field">
            <span>Category</span>

            <div className="input-control">
              <Package size={18} />

              <select
                name="product_category_encoded"
                value={formData.product_category_encoded}
                onChange={onChange}
              >
                <option value="">Select category</option>

                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="input-field">
            <span>Purchase month</span>

            <div className="input-control">
              <CalendarDays size={18} />

              <select
                name="purchase_month"
                value={formData.purchase_month}
                onChange={onChange}
              >
                <option value="">Select month</option>

                {months.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="input-field">
            <span>Day of week</span>

            <div className="input-control">
              <CalendarDays size={18} />

              <select
                name="purchase_dayofweek"
                value={formData.purchase_dayofweek}
                onChange={onChange}
              >
                <option value="">Select day</option>

                {weekdays.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="input-field">
            <span>Delivery days</span>

            <div className="input-control">
              <Truck size={18} />

              <input
                type="number"
                step="any"
                min="0"
                name="delivery_days"
                value={formData.delivery_days}
                onChange={onChange}
                placeholder="8"
              />
            </div>
          </label>

          <label className="input-field">
            <span>Seller reference</span>

            <div className="input-control">
              <Store size={18} />

              <input
                type="number"
                min="0"
                name="seller_encoded"
                value={formData.seller_encoded}
                onChange={onChange}
                placeholder="100"
              />
            </div>
          </label>
        </div>

        {error && <div className="form-error">{error}</div>}

        <button className="primary-action" type="submit" disabled={loading}>
          {loading ? "Calculating prediction..." : "Predict optimal price"}
        </button>
      </form>
    </motion.section>
  );
}

export default InputForm;