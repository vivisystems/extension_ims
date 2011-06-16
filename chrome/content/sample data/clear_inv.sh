sqlite3 /data/databases/vivipos_inventory.sqlite <<EOF
drop table GRs;
drop table GR_details;
delete from stock_records;
delete from inventory_commitments;
delete from inventory_records;
drop table product_costs;
EOF

sqlite3 /data/databases/vivipos_order.sqlite <<EOF
drop table order_item_costs;
EOF
