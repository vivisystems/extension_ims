sqlite3 /data/databases/vivipos_inventory.sqlite <<EOF
delete from GRs;
delete from GR_details;
delete from stock_records;
delete from inventory_commitments;
delete from inventory_records;
delete from product_costs;
EOF

sqlite3 /data/databases/vivipos_order.sqlite <<EOF
delete from order_item_costs;
EOF
