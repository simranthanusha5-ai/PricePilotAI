import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBRegressor

# 1. Read CSV files
orders = pd.read_csv("data/olist_orders_dataset.csv")
order_items = pd.read_csv("data/olist_order_items_dataset.csv")
products = pd.read_csv("data/olist_products_dataset.csv")

# 2. Merge datasets
merged_df = order_items.merge(orders, on="order_id", how="left")
final_df = merged_df.merge(products, on="product_id", how="left")

print("Final combined dataset:", final_df.shape)

# 3. Clean missing values
final_df["product_photos_qty"] = final_df["product_photos_qty"].fillna(0)
final_df["product_weight_g"] = final_df["product_weight_g"].fillna(final_df["product_weight_g"].median())
final_df["product_length_cm"] = final_df["product_length_cm"].fillna(final_df["product_length_cm"].median())
final_df["product_height_cm"] = final_df["product_height_cm"].fillna(final_df["product_height_cm"].median())
final_df["product_width_cm"] = final_df["product_width_cm"].fillna(final_df["product_width_cm"].median())

# 4. Feature engineering
final_df["product_volume_cm3"] = (
    final_df["product_length_cm"]
    * final_df["product_width_cm"]
    * final_df["product_height_cm"]
)

final_df["product_density"] = (
    final_df["product_weight_g"] /
    (final_df["product_volume_cm3"] + 1)
)

final_df["product_category_name"] = final_df["product_category_name"].fillna("Unknown")
category_encoder = LabelEncoder()
final_df["product_category_encoded"] = category_encoder.fit_transform(final_df["product_category_name"])

final_df["order_purchase_timestamp"] = pd.to_datetime(final_df["order_purchase_timestamp"])
final_df["purchase_month"] = final_df["order_purchase_timestamp"].dt.month
final_df["purchase_dayofweek"] = final_df["order_purchase_timestamp"].dt.dayofweek

final_df["order_delivered_customer_date"] = pd.to_datetime(
    final_df["order_delivered_customer_date"],
    errors="coerce"
)

final_df["delivery_days"] = (
    final_df["order_delivered_customer_date"] - final_df["order_purchase_timestamp"]
).dt.days

final_df["delivery_days"] = final_df["delivery_days"].fillna(final_df["delivery_days"].median())

seller_encoder = LabelEncoder()
final_df["seller_encoded"] = seller_encoder.fit_transform(final_df["seller_id"])

# 5. Save combined dataset
final_df.to_csv("data/combined_olist_dataset.csv", index=False)
print("Saved combined dataset!")

# 6. Features and target
X = final_df[[
    "freight_value",
    "product_weight_g",
    "product_length_cm",
    "product_height_cm",
    "product_width_cm",
    "product_photos_qty",
    "product_volume_cm3",
    "product_density",
    "product_category_encoded",
    "purchase_month",
    "purchase_dayofweek",
    "delivery_days",
    "seller_encoded"
]]

y = final_df["price"]

print("Features shape:", X.shape)
print("Target shape:", y.shape)

# 7. Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 8. Linear Regression
lr_model = LinearRegression()
lr_model.fit(X_train, y_train)
lr_predictions = lr_model.predict(X_test)

print("\n===== Linear Regression =====")
print("MAE :", round(mean_absolute_error(y_test, lr_predictions), 2))
print("RMSE:", round(np.sqrt(mean_squared_error(y_test, lr_predictions)), 2))
print("R²  :", round(r2_score(y_test, lr_predictions), 4))

# 9. Tuned XGBoost
base_xgb = XGBRegressor(
    random_state=42,
    objective="reg:squarederror"
)

param_grid = {
    "n_estimators": [300, 400, 500],
    "max_depth": [8, 10, 12],
    "learning_rate": [0.03, 0.05, 0.1],
    "subsample": [0.8, 1.0],
    "colsample_bytree": [0.8, 1.0],
    "min_child_weight": [1, 3, 5]
}

random_search = RandomizedSearchCV(
    estimator=base_xgb,
    param_distributions=param_grid,
    n_iter=15,
    scoring="r2",
    cv=3,
    verbose=1,
    random_state=42,
    n_jobs=-1
)

random_search.fit(X_train, y_train)

xgb_model = random_search.best_estimator_

print("\nBest XGBoost parameters:")
print(random_search.best_params_)

xgb_predictions = xgb_model.predict(X_test)

print("\n===== XGBoost Tuned =====")
print("MAE :", round(mean_absolute_error(y_test, xgb_predictions), 2))
print("RMSE:", round(np.sqrt(mean_squared_error(y_test, xgb_predictions)), 2))
print("R²  :", round(r2_score(y_test, xgb_predictions), 4))

# 10. Save model
joblib.dump(xgb_model, "price_prediction_model.pkl")
print("XGBoost tuned model saved successfully!")