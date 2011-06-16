sqlite3 /data/databases/vivipos_inventory.sqlite <<EOF
drop table POs;
drop table PO_details;
drop table GRs;
drop table GR_details;
drop table product_costs;
drop table suppliers;
EOF

sqlite3 /data/databases/vivipos_order.sqlite <<EOF
drop table order_item_costs;
EOF
