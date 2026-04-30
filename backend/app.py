from flask import request, jsonify
import jwt
from functools import wraps
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from decimal import Decimal
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
SECRET_KEY = os.getenv("JWT_SECRET", "secret123")
CORS(app)

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME")
}

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            token = auth_header.split(" ")[1] if " " in auth_header else auth_header

        if not token:
            return jsonify({"message": "Token is missing"}), 401

        try:
            jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except:
            return jsonify({"message": "Invalid or expired token"}), 401

        return f(*args, **kwargs)

    return decorated

def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)


def to_float(value):
    if isinstance(value, Decimal):
        return float(value)
    return value


def serialize_row(row):
    return {k: to_float(v) for k, v in row.items()}


def get_downloads_folder():
    return Path.home() / "Downloads"


def generate_invoice_pdf_file(order_data):
    order_id = order_data["order_id"]
    customer_name = order_data.get("customer_name") or "Walk-in Customer"
    customer_phone = str(order_data.get("phone") or "")
    customer_email = str(order_data.get("email") or "")
    customer_address = str(order_data.get("address") or "")
    order_date = str(order_data.get("order_date") or "")
    status = str(order_data.get("status") or "")
    notes = str(order_data.get("notes") or "")
    items = order_data.get("items", [])
    total_amount = float(order_data.get("total_amount", 0))

    downloads = get_downloads_folder()
    downloads.mkdir(parents=True, exist_ok=True)

    filename = f"invoice_{order_id}.pdf"
    file_path = downloads / filename

    c = canvas.Canvas(str(file_path), pagesize=A4)
    width, height = A4

    left_margin = 18 * mm
    right_margin = 18 * mm
    usable_width = width - left_margin - right_margin
    y = height - 18 * mm

    def money(value):
        return f"ETB {float(value):,.2f}"

    def draw_wrapped_text(text, x, y_pos, max_width, line_height=5 * mm,
                          font_name="Helvetica", font_size=10):
        c.setFont(font_name, font_size)
        words = str(text).split()
        lines = []
        current = ""

        for word in words:
            test_line = f"{current} {word}".strip()
            if c.stringWidth(test_line, font_name, font_size) <= max_width:
                current = test_line
            else:
                if current:
                    lines.append(current)
                current = word

        if current:
            lines.append(current)

        for line in lines:
            c.drawString(x, y_pos, line)
            y_pos -= line_height

        return y_pos

    def draw_table_header(y_pos):
        c.setFillColor(colors.HexColor("#E5E7EB"))
        c.rect(left_margin, y_pos - 8 * mm, usable_width, 8 * mm, stroke=0, fill=1)

        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(left_margin + 3 * mm, y_pos - 5.5 * mm, "Item")
        c.drawString(left_margin + 95 * mm, y_pos - 5.5 * mm, "Qty")
        c.drawString(left_margin + 115 * mm, y_pos - 5.5 * mm, "Unit Price")
        c.drawString(left_margin + 150 * mm, y_pos - 5.5 * mm, "Line Total")

    c.setStrokeColor(colors.HexColor("#111827"))
    c.setLineWidth(1)
    c.line(left_margin, y, width - right_margin, y)
    y -= 10 * mm

    logo_path = Path(__file__).parent / "logo.png"
    print("Logo exists:", logo_path.exists())
    print("Logo path:", logo_path)

    if logo_path.exists():
        try:
            c.drawImage(
                ImageReader(str(logo_path)),
                left_margin,
                y - 18 * mm,
                width=30 * mm,
                height=20 * mm,
                preserveAspectRatio=True,
                mask="auto"
            )
        except Exception as e:
            print("Logo error:", e)

    c.setFillColor(colors.HexColor("#111827"))
    c.setFont("Helvetica-Bold", 20)
    c.drawString(left_margin + 34 * mm, y - 3 * mm, "Candle Shop")

    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor("#4B5563"))
    c.drawString(left_margin + 34 * mm, y - 10 * mm, "Addis Ababa, Ethiopia")
    c.drawString(left_margin + 34 * mm, y - 15 * mm, "Phone: +251")
    c.drawString(left_margin + 34 * mm, y - 20 * mm, "Email: info@candleshop.local")

    box_width = 62 * mm
    box_height = 28 * mm
    box_x = width - right_margin - box_width
    box_y = y + 4 * mm

    c.setStrokeColor(colors.HexColor("#D1D5DB"))
    c.setFillColor(colors.HexColor("#F9FAFB"))
    c.roundRect(box_x, box_y - box_height, box_width, box_height, 3 * mm, stroke=1, fill=1)

    c.setFillColor(colors.HexColor("#111827"))
    c.setFont("Helvetica-Bold", 14)
    c.drawString(box_x + 4 * mm, box_y - 6 * mm, "INVOICE")

    c.setFont("Helvetica", 9)
    c.drawString(box_x + 4 * mm, box_y - 12 * mm, f"Invoice No: {order_id}")
    c.drawString(box_x + 4 * mm, box_y - 17 * mm, f"Date: {order_date}")
    c.drawString(box_x + 4 * mm, box_y - 22 * mm, f"Status: {status}")

    y -= 34 * mm

    c.setFillColor(colors.HexColor("#111827"))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(left_margin, y, "Bill To")
    y -= 8 * mm

    bill_box_height = 34 * mm
    c.setStrokeColor(colors.HexColor("#D1D5DB"))
    c.setFillColor(colors.white)
    c.roundRect(left_margin, y - bill_box_height + 3 * mm, 95 * mm, bill_box_height, 3 * mm, stroke=1, fill=1)

    c.setFillColor(colors.HexColor("#111827"))
    c.setFont("Helvetica-Bold", 11)
    c.drawString(left_margin + 4 * mm, y - 4 * mm, customer_name)

    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#6B7280"))

    info_y = y - 10 * mm
    if customer_phone:
        c.drawString(left_margin + 4 * mm, info_y, f"Phone: {customer_phone}")
        info_y -= 5 * mm

    if customer_email:
        c.drawString(left_margin + 4 * mm, info_y, f"Email: {customer_email}")
        info_y -= 5 * mm

    if customer_address:
        c.drawString(left_margin + 4 * mm, info_y, f"Address: {customer_address[:45]}")

    y -= 40 * mm

    draw_table_header(y)
    y -= 10 * mm

    row_height = 9 * mm
    c.setFont("Helvetica", 10)

    for item in items:
        product_name = str(item.get("product_name", ""))
        quantity = int(item.get("quantity", 0))
        unit_price = float(item.get("unit_price", 0))
        line_total = float(item.get("line_total", 0))

        if y < 45 * mm:
            c.showPage()
            y = height - 20 * mm

            c.setStrokeColor(colors.HexColor("#111827"))
            c.setLineWidth(1)
            c.line(left_margin, y, width - right_margin, y)
            y -= 12 * mm

            draw_table_header(y)
            y -= 10 * mm

        c.setStrokeColor(colors.HexColor("#E5E7EB"))
        c.rect(left_margin, y - row_height + 2 * mm, usable_width, row_height, stroke=1, fill=0)

        c.setFillColor(colors.black)
        c.setFont("Helvetica", 10)
        c.drawString(left_margin + 3 * mm, y - 4.8 * mm, product_name[:38])
        c.drawRightString(left_margin + 110 * mm, y - 4.8 * mm, str(quantity))
        c.drawRightString(left_margin + 147 * mm, y - 4.8 * mm, money(unit_price))
        c.drawRightString(left_margin + usable_width - 4 * mm, y - 4.8 * mm, money(line_total))

        y -= row_height

    y -= 8 * mm

    total_box_width = 70 * mm
    total_box_height = 16 * mm
    total_box_x = width - right_margin - total_box_width

    c.setStrokeColor(colors.HexColor("#111827"))
    c.setFillColor(colors.HexColor("#F9FAFB"))
    c.roundRect(total_box_x, y - total_box_height, total_box_width, total_box_height, 3 * mm, stroke=1, fill=1)

    c.setFillColor(colors.HexColor("#111827"))
    c.setFont("Helvetica-Bold", 11)
    c.drawString(total_box_x + 4 * mm, y - 6 * mm, "Total Amount")
    c.drawRightString(total_box_x + total_box_width - 4 * mm, y - 6 * mm, money(total_amount))

    y -= 24 * mm

    if notes:
        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(colors.HexColor("#111827"))
        c.drawString(left_margin, y, "Notes")
        y -= 7 * mm

        notes_box_height = 18 * mm
        c.setStrokeColor(colors.HexColor("#D1D5DB"))
        c.setFillColor(colors.white)
        c.roundRect(left_margin, y - notes_box_height + 2 * mm, usable_width, notes_box_height, 3 * mm, stroke=1, fill=1)

        y = draw_wrapped_text(
            notes,
            left_margin + 4 * mm,
            y - 5 * mm,
            usable_width - 8 * mm,
            line_height=4.5 * mm,
            font_name="Helvetica",
            font_size=9,
        )

        y -= 8 * mm

    footer_y = 15 * mm
    c.setStrokeColor(colors.HexColor("#D1D5DB"))
    c.line(left_margin, footer_y + 6 * mm, width - right_margin, footer_y + 6 * mm)

    c.setFont("Helvetica-Oblique", 10)
    c.setFillColor(colors.HexColor("#6B7280"))
    c.drawCentredString(width / 2, footer_y, "Thank you for your business.")

    c.save()
    return str(file_path)


@app.route("/")
def home():
    return jsonify({"message": "Candle Shop API is running"})


@app.route("/products", methods=["GET"])
@token_required
def get_products():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                product_id AS id,
                product_name AS name,
                candle_type,
                scent,
                size,
                selling_price AS price,
                stock_qty AS stock,
                reorder_level,
                is_active,
                created_at
            FROM products
            ORDER BY product_id DESC
        """)
        rows = [serialize_row(r) for r in cursor.fetchall()]
        return jsonify(rows), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@app.route("/products", methods=["POST"])
@token_required
def add_product():
    conn = None
    cursor = None
    try:
        data = request.get_json()

        name = data.get("name")
        price = data.get("price")
        stock = data.get("stock")
        candle_type = data.get("candle_type")
        scent = data.get("scent")
        size = data.get("size")
        reorder_level = data.get("reorder_level", 5)

        if not name or price is None or stock is None:
            return jsonify({"message": "name, price and stock are required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO products
            (product_name, candle_type, scent, size, selling_price, stock_qty, reorder_level, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (name, candle_type, scent, size, price, stock, reorder_level, 1))
        conn.commit()

        return jsonify({
            "message": "Product added successfully",
            "product_id": cursor.lastrowid
        }), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@app.route("/products/<int:product_id>", methods=["PUT"])
@token_required
def update_product(product_id):
    conn = None
    cursor = None
    try:
        data = request.get_json()

        name = data.get("name")
        price = data.get("price")
        stock = data.get("stock")

        if not name or price is None or stock is None:
            return jsonify({"message": "name, price and stock are required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE products
            SET product_name = %s,
                selling_price = %s,
                stock_qty = %s
            WHERE product_id = %s
        """, (name, price, stock, product_id))

        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "Product not found"}), 404

        return jsonify({"message": "Product updated successfully"}), 200

    except Error as e:
        return jsonify({"error": str(e)}), 500

    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@app.route("/products/<int:product_id>", methods=["DELETE"])
@token_required
def delete_product(product_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM products WHERE product_id = %s", (product_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "Product not found"}), 404

        return jsonify({"message": "Product deleted successfully"}), 200

    except Error as e:
        return jsonify({"error": str(e)}), 500

    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@app.route("/customers", methods=["GET"])
@token_required
def get_customers():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                customer_id AS id,
                customer_name AS name,
                phone,
                email,
                address,
                created_at
            FROM customers
            ORDER BY customer_id DESC
        """)
        rows = [serialize_row(r) for r in cursor.fetchall()]
        return jsonify(rows), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@app.route("/customers", methods=["POST"])
@token_required
def add_customer():
    conn = None
    cursor = None
    try:
        data = request.get_json()

        name = data.get("name")
        phone = data.get("phone")
        email = data.get("email")
        address = data.get("address")

        if not name:
            return jsonify({"message": "Customer name is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO customers (customer_name, phone, email, address)
            VALUES (%s, %s, %s, %s)
        """, (name, phone, email, address))
        conn.commit()

        return jsonify({
            "message": "Customer added successfully",
            "customer_id": cursor.lastrowid
        }), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@app.route("/customers/<int:customer_id>", methods=["PUT"])
@token_required
def update_customer(customer_id):
    conn = None
    cursor = None
    try:
        data = request.get_json()

        name = data.get("name")
        phone = data.get("phone")
        email = data.get("email")
        address = data.get("address")

        if not name:
            return jsonify({"message": "Customer name is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE customers
            SET customer_name = %s,
                phone = %s,
                email = %s,
                address = %s
            WHERE customer_id = %s
        """, (name, phone, email, address, customer_id))

        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "Customer not found"}), 404

        return jsonify({"message": "Customer updated successfully"}), 200

    except Error as e:
        return jsonify({"error": str(e)}), 500

    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@app.route("/customers/<int:customer_id>", methods=["DELETE"])
@token_required
def delete_customer(customer_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM customers WHERE customer_id = %s", (customer_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "Customer not found"}), 404

        return jsonify({"message": "Customer deleted successfully"}), 200

    except Error as e:
        return jsonify({"error": str(e)}), 500

    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass

@app.route("/orders", methods=["GET"])
@token_required
def get_orders():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                o.order_id AS id,
                o.customer_id,
                c.customer_name AS customer_name,
                o.order_date,
                o.status,
                o.total_amount,
                o.notes
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.customer_id
            ORDER BY o.order_id DESC
        """)
        rows = [serialize_row(r) for r in cursor.fetchall()]
        return jsonify(rows), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@app.route("/orders", methods=["POST"])
@token_required
def create_order():
    conn = None
    cursor = None

    try:
        data = request.get_json()

        customer_id = data.get("customer_id")
        status = data.get("status", "Pending")
        notes = data.get("notes")
        items = data.get("items", [])
        payment_method = data.get("payment_method", "Cash")
        reference_no = data.get("reference_no")

        if not customer_id:
            return jsonify({"message": "customer_id is required"}), 400

        if not items or len(items) == 0:
            return jsonify({"message": "At least one order item is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        conn.start_transaction()

        total_amount = 0
        order_lines = []

        for item in items:
            product_id = item.get("product_id")
            quantity = int(item.get("quantity", 0))

            if not product_id or quantity <= 0:
                raise ValueError("Each item must have valid product_id and quantity")

            cursor.execute("""
                SELECT product_id, product_name, selling_price, stock_qty
                FROM products
                WHERE product_id = %s AND is_active = 1
            """, (product_id,))
            product = cursor.fetchone()

            if not product:
                raise ValueError(f"Product {product_id} not found")

            if product["stock_qty"] < quantity:
                raise ValueError(f"Not enough stock for {product['product_name']}")

            unit_price = float(product["selling_price"])
            line_total = unit_price * quantity
            total_amount += line_total

            order_lines.append({
                "product_id": product_id,
                "quantity": quantity,
                "unit_price": unit_price,
                "line_total": line_total
            })

        cursor.execute("""
            INSERT INTO orders (customer_id, status, total_amount, notes)
            VALUES (%s, %s, %s, %s)
        """, (customer_id, status, total_amount, notes))
        order_id = cursor.lastrowid

        for line in order_lines:
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                order_id,
                line["product_id"],
                line["quantity"],
                line["unit_price"],
                line["line_total"]
            ))

            cursor.execute("""
                UPDATE products
                SET stock_qty = stock_qty - %s
                WHERE product_id = %s
            """, (line["quantity"], line["product_id"]))

        cursor.execute("""
            INSERT INTO payments (order_id, amount, payment_method, reference_no)
            VALUES (%s, %s, %s, %s)
        """, (order_id, total_amount, payment_method, reference_no))

        conn.commit()

        return jsonify({
            "message": "Order created successfully",
            "order_id": order_id,
            "total_amount": total_amount
        }), 201

    except ValueError as e:
        if conn:
            conn.rollback()
        return jsonify({"message": str(e)}), 400

    except Error as e:
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@app.route("/orders/<int:order_id>", methods=["GET"])
@token_required
def get_order_details(order_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                o.order_id,
                o.customer_id,
                c.customer_name,
                c.phone,
                c.email,
                c.address,
                o.order_date,
                o.status,
                o.total_amount,
                o.notes
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.customer_id
            WHERE o.order_id = %s
        """, (order_id,))
        order = cursor.fetchone()

        if not order:
            return jsonify({"message": "Order not found"}), 404

        cursor.execute("""
            SELECT
                oi.order_item_id,
                oi.product_id,
                p.product_name,
                oi.quantity,
                oi.unit_price,
                oi.line_total
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = %s
        """, (order_id,))
        items = [serialize_row(r) for r in cursor.fetchall()]

        cursor.execute("""
            SELECT
                payment_id,
                order_id,
                payment_date,
                amount,
                payment_method,
                reference_no
            FROM payments
            WHERE order_id = %s
            ORDER BY payment_id DESC
        """, (order_id,))
        payments = [serialize_row(r) for r in cursor.fetchall()]

        order = serialize_row(order)
        order["items"] = items
        order["payments"] = payments

        return jsonify(order), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@app.route("/orders/<int:order_id>/invoice", methods=["GET"])
@token_required
def download_order_invoice(order_id):
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                o.order_id,
                o.customer_id,
                c.customer_name,
                c.phone,
                c.email,
                c.address,
                o.order_date,
                o.status,
                o.total_amount,
                o.notes
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.customer_id
            WHERE o.order_id = %s
        """, (order_id,))
        order = cursor.fetchone()

        if not order:
            return jsonify({"message": "Order not found"}), 404

        cursor.execute("""
            SELECT
                oi.order_item_id,
                oi.product_id,
                p.product_name,
                oi.quantity,
                oi.unit_price,
                oi.line_total
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = %s
        """, (order_id,))
        items = [serialize_row(r) for r in cursor.fetchall()]

        order = serialize_row(order)
        order["items"] = items

        pdf_path = generate_invoice_pdf_file(order)

        return send_file(
            pdf_path,
            as_attachment=True,
            download_name=f"invoice_{order_id}.pdf",
            mimetype="application/pdf"
        )

    except Error as e:
        return jsonify({"error": str(e)}), 500

    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@app.route("/dashboard", methods=["GET"])
@token_required
def dashboard():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT COUNT(*) AS total_products FROM products WHERE is_active = 1")
        total_products = cursor.fetchone()["total_products"]

        cursor.execute("SELECT COUNT(*) AS total_customers FROM customers")
        total_customers = cursor.fetchone()["total_customers"]

        cursor.execute("SELECT COUNT(*) AS total_orders FROM orders")
        total_orders = cursor.fetchone()["total_orders"]

        cursor.execute("SELECT COALESCE(SUM(total_amount), 0) AS total_sales FROM orders")
        total_sales = to_float(cursor.fetchone()["total_sales"])

        return jsonify({
            "total_products": total_products,
            "total_customers": total_customers,
            "total_orders": total_orders,
            "total_sales": total_sales
        }), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@app.route("/reports/low-stock", methods=["GET"])
@token_required
def low_stock_report():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                item_type,
                item_name,
                qty_available,
                reorder_level,
                unit
            FROM low_stock_alerts
        """)
        rows = [serialize_row(r) for r in cursor.fetchall()]
        return jsonify(rows), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@app.route("/reports/sales-summary", methods=["GET"])
@token_required
def sales_summary_report():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                product_id,
                product_name,
                total_qty_sold,
                total_revenue
            FROM sales_summary_by_product
        """)
        rows = [serialize_row(r) for r in cursor.fetchall()]
        return jsonify(rows), 200
    except Error as e:
        print("Sales summary database error:", str(e))
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print("Sales summary unexpected error:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@app.route("/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json() or {}

    username = data.get("username")
    password = data.get("password")

    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    admin_password = os.getenv("ADMIN_PASSWORD", "1234")

    if username == admin_username and password == admin_password:
        token = jwt.encode(
            {"username": username},
            SECRET_KEY,
            algorithm="HS256"
        )

        return jsonify({
            "message": "Login successful",
            "success": True,
            "token": token
        }), 200

    return jsonify({
        "message": "Invalid username or password",
        "success": False
    }), 401

if __name__ == "__main__":
    import os
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000))
    )
