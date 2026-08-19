import { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function formatModuleName(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function PredictionHistory() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const token = localStorage.getItem("pricepilot_token");

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Could not load prediction history."
        );
      }

      setRecords(data);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Could not load prediction history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const modules = useMemo(() => {
    return [
      ...new Set(
        records.map((record) => record.module)
      ),
    ];
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return records.filter((record) => {
      const matchesModule =
        moduleFilter === "all" ||
        record.module === moduleFilter;

      const matchesSearch =
        !query ||
        [
          record.module,
          record.product_name,
          record.created_at,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
        );

      return matchesModule && matchesSearch;
    });
  }, [records, moduleFilter, searchTerm]);

  const deleteRecord = async (recordId) => {
    const confirmed = window.confirm(
      "Delete this prediction-history record?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/history/${recordId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Could not delete history record."
        );
      }

      setRecords((current) =>
        current.filter(
          (record) => record.id !== recordId
        )
      );

      if (selectedRecord?.id === recordId) {
        setSelectedRecord(null);
      }
    } catch (requestError) {
      setError(
        requestError.message ||
          "Could not delete history record."
      );
    }
  };

  return (
    <main className="dashboard-content">
      <section className="hero-section">
        <div>
          <span className="eyebrow">
            Saved activity
          </span>

          <h1>Prediction History</h1>

          <p>
            Review previous forecasts, competitor analyses,
            revenue optimizations, and pricing predictions.
          </p>
        </div>
      </section>

      <section className="dashboard-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              History records
            </span>

            <h2>Saved predictions</h2>
          </div>

          <button
            type="button"
            className="secondary-action"
            onClick={loadHistory}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        <div className="history-toolbar">
          <div className="product-search">
            <Search size={18} />

            <input
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search module, product or date"
            />
          </div>

          <select
            value={moduleFilter}
            onChange={(event) =>
              setModuleFilter(event.target.value)
            }
          >
            <option value="all">All modules</option>

            {modules.map((module) => (
              <option key={module} value={module}>
                {formatModuleName(module)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="forecast-error">
            {error}
          </div>
        )}

        {loading ? (
          <p>Loading prediction history...</p>
        ) : filteredRecords.length === 0 ? (
          <div className="history-empty">
            <Clock3 size={30} />
            <h3>No saved predictions yet</h3>
            <p>
              New records will appear here after history saving
              is connected to the AI modules.
            </p>
          </div>
        ) : (
          <div className="product-table-wrapper">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Module</th>
                  <th>Product</th>
                  <th>Summary</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => {
                  const resultData = parseJson(
                    record.result_data
                  );

                  const summary =
                    resultData.predicted_price ??
                    resultData.total_predicted_demand ??
                    resultData.optimized_price ??
                    resultData.recommendation ??
                    "View details";

                  return (
                    <tr key={record.id}>
                      <td>
                        {new Date(
                          record.created_at
                        ).toLocaleString()}
                      </td>

                      <td>
                        {formatModuleName(
                          record.module
                        )}
                      </td>

                      <td>
                        {record.product_name || "—"}
                      </td>

                      <td>
                        {String(summary)}
                      </td>

                      <td>
                        <div className="product-actions">
                          <button
                            type="button"
                            title="View details"
                            onClick={() =>
                              setSelectedRecord(record)
                            }
                          >
                            <Clock3 size={17} />
                          </button>

                          <button
                            type="button"
                            title="Delete"
                            onClick={() =>
                              deleteRecord(record.id)
                            }
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedRecord && (
        <section className="dashboard-card history-detail-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                Record details
              </span>

              <h2>
                {formatModuleName(
                  selectedRecord.module
                )}
              </h2>
            </div>

            <button
              type="button"
              className="secondary-action"
              onClick={() =>
                setSelectedRecord(null)
              }
            >
              Close
            </button>
          </div>

          <div className="history-detail-grid">
            <article>
              <span>Product</span>
              <strong>
                {selectedRecord.product_name || "Not specified"}
              </strong>
            </article>

            <article>
              <span>Created</span>
              <strong>
                {new Date(
                  selectedRecord.created_at
                ).toLocaleString()}
              </strong>
            </article>
          </div>

          <div className="history-json-grid">
            <div>
              <h3>Input data</h3>

              <pre>
                {JSON.stringify(
                  parseJson(selectedRecord.input_data),
                  null,
                  2
                )}
              </pre>
            </div>

            <div>
              <h3>Result data</h3>

              <pre>
                {JSON.stringify(
                  parseJson(selectedRecord.result_data),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default PredictionHistory;