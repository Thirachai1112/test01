import qrcode
import os
import mysql.connector
import socket  # เพิ่มตัวนี้เพื่อดึงชื่อเครื่องอัตโนมัติ

# --- 1. ตั้งค่าการเชื่อมต่อฐานข้อมูล ---
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "password123",
    "database": "my_database"
}

def generate_item_qrcode(item_id, item_name):
    # ใช้ชื่อเครื่องคอมพิวเตอร์แทน IP (เช่น DESKTOP-ABC.local)
    hostname = socket.gethostname()
    server_address = "192.168.1.159"
    
    # ชี้ไปที่ testqr.html (พอร์ต 5000 ของ Node.js)
    # ต้องชื่อเดียวกับไฟล์ HTML ที่เรามี
    full_url = f"http://{server_address}:5000/testqr.html?id={item_id}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    
    qr.add_data(full_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    if not os.path.exists('generated_qrcodes'):
        os.makedirs('generated_qrcodes')
        
    clean_name = "".join([c for c in item_name if c.isalnum() or c in (' ', '_')]).rstrip()
    file_name = f"generated_qrcodes/qr_{item_id}_{clean_name.replace(' ', '_')}.png"
    img.save(file_name)
    
    print(f"✅ สร้าง QR สำเร็จ: {file_name}")
    print(f"🔗 URL ใน QR คือ: {full_url}")

# --- ส่วนดึงข้อมูล ---
try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    cursor.execute("SELECT item_id, item_name FROM items")
    rows = cursor.fetchall()

    for row in rows:
        generate_item_qrcode(row[0], row[1])

except mysql.connector.Error as err:
    print(f"❌ Database Error: {err}")
finally:
    if 'conn' in locals() and conn.is_connected():
        cursor.close()
        conn.close()