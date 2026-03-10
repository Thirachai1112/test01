DROP TABLE IF EXISTS admins;
CREATE TABLE admins (
  admin_id int NOT NULL GENERATED ALWAYS AS IDENTITY,
  username varchar(50) NOT NULL,
  password varchar(255) NOT NULL,
  last_login timestamp(0) DEFAULT NULL,
  created_at timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (admin_id),
  CONSTRAINT username UNIQUE (username)
)  ;

INSERT INTO admins OVERRIDING SYSTEM VALUE VALUES (1,'THI1411','123456',NULL,'2026-01-07 06:12:50');

DROP TABLE IF EXISTS roles;
CREATE TABLE roles (
  role_id int NOT NULL GENERATED ALWAYS AS IDENTITY,
  role_name varchar(50) NOT NULL,
  borrow_limit int DEFAULT '3',
  PRIMARY KEY (role_id)
)  ;

INSERT INTO roles OVERRIDING SYSTEM VALUE VALUES (1,'Admin',99),(2,'Staff',3);

DROP TABLE IF EXISTS employees CASCADE;
CREATE TABLE employees (
  id int NOT NULL GENERATED ALWAYS AS IDENTITY,
  first_name varchar(50) NOT NULL,
  last_name varchar(50) DEFAULT NULL,
  employees_code varchar(10) DEFAULT NULL,
    phone_number varchar(12) DEFAULT NULL,
  Affiliation varchar(20) DEFAULT NULL,
  created_at timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  role_id int DEFAULT NULL,
  PRIMARY KEY (id)
,
  CONSTRAINT fk_emp_role FOREIGN KEY (role_id) REFERENCES roles (role_id)
)  ;

CREATE INDEX fk_emp_role ON employees (role_id);
INSERT INTO employees OVERRIDING SYSTEM VALUE VALUES (30,'นางสาวมลฤดี','ใหลหลั่ง','9008842','045-481-197','การไฟฟ้าตระการพืชผล','2026-02-04 05:25:53',2),(34,'-','-','-','-','-','2026-02-06 03:36:57',2),(35,'ำดำ','ดำ','ดำด','ำดำ','ดำด','2026-02-07 04:07:10',2),(36,'หก','หก','หกห','กหกห','กหกห','2026-02-07 04:12:03',2),(37,'หก','หกหกห','กหก','หกห','กหก','2026-02-07 04:14:45',2),(38,'กห','กหก','หกหก','หก','หกหก','2026-02-07 04:17:50',2),(39,'sdsds','dsdsd','dsds','sds','dsd','2026-02-07 04:24:32',2),(40,'นายองกรณ์','นามโครตร','514760','ไม่มี','กฟส.บจล.','2026-02-09 08:48:13',2),(41,'kkk','kkk','kk','kkk','kkk','2026-02-11 09:22:34',2),(42,'x','sxs','sx','sxs','xsx','2026-02-13 05:53:40',2),(43,'ธีระชัย','ยนวว','วววว','วววว','ววว','2026-02-17 02:44:39',2),(44,'น.ส.ภัทรวดี','กิ่งมาลา','515106','0659165791','ผสห.กบพ.','2026-02-17 03:11:24',2);

DROP TABLE IF EXISTS categories CASCADE;
CREATE TABLE categories (
  cat_id int NOT NULL,
  item_type varchar(255) DEFAULT NULL,
  PRIMARY KEY (cat_id)
) ;

INSERT INTO categories VALUES (1,'Computer'),(2,'อุปกรณ์สำนักงาน'),(3,'Network'),(4,'อะไหล่คอมพิวเตอร์'),(5,'สื่อบันทึกข้อมูล'),(6,'เครื่องมือช่าง'),(7,'เครื่องพิมพ์เอกสาร'),(8,'Mouse & Keyboard');

DROP TABLE IF EXISTS items CASCADE;
CREATE TABLE items (
  item_id int NOT NULL GENERATED ALWAYS AS IDENTITY,
  item_name varchar(100) NOT NULL,
  asset_number varchar(50) DEFAULT NULL,
  serial_number varchar(100) DEFAULT NULL,
  cat_id int DEFAULT NULL,
  status varchar(30) check (status in ('Available','Borrowed','Maintenance','Broken','Scrapped')) NOT NULL,
  created_at timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  image_url varchar(255) DEFAULT 'default_device.png',
  contract_number varchar(100) DEFAULT NULL,
  PRIMARY KEY (item_id),
  CONSTRAINT serial_number UNIQUE (serial_number)
,
  CONSTRAINT fk_category FOREIGN KEY (cat_id) REFERENCES categories (cat_id)
)  ;

CREATE INDEX fk_category ON items (cat_id);
CREATE INDEX idx_item_name ON items (item_name);
CREATE INDEX idx_contract_number ON items (contract_number);
CREATE INDEX idx_serial_number ON items (serial_number);

-- ...existing code...

DROP TABLE IF EXISTS borrowing_logs CASCADE;
CREATE TABLE borrowing_logs (
  log_id int NOT NULL GENERATED ALWAYS AS IDENTITY,
  employee_id int DEFAULT NULL,
  item_id int DEFAULT NULL,
  borrow_date timestamp(0) DEFAULT CURRENT_TIMESTAMP,
  return_date timestamp(0) DEFAULT NULL,
  note text,
  purpose varchar(255) DEFAULT NULL,
  admin_id int DEFAULT NULL,
  PRIMARY KEY (log_id)
,
  CONSTRAINT borrowing_logs_ibfk_1 FOREIGN KEY (employee_id) REFERENCES employees (id),
  CONSTRAINT borrowing_logs_ibfk_2 FOREIGN KEY (item_id) REFERENCES items (item_id),
  CONSTRAINT fk_admin_log FOREIGN KEY (admin_id) REFERENCES admins (admin_id),
  CONSTRAINT fk_log_admin FOREIGN KEY (admin_id) REFERENCES admins (admin_id)
)  ;


CREATE INDEX employee_id ON borrowing_logs (employee_id);
CREATE INDEX item_id ON borrowing_logs (item_id);
CREATE INDEX fk_admin_log ON borrowing_logs (admin_id);

-- The following rows are commented out because item_id does not exist in items table:
-- (46,30,190,'2026-02-04 05:25:53',NULL,'ยืมผ่านระบบ','switc ไม่สามารถใช้งานได้เลยต้องยืมจาก ผคข.กดส.ฉ.2 ใช้งาน ชั่วคราว',NULL)
-- (50,34,195,'2026-02-06 03:36:57',NULL,'ยืมผ่านระบบ','ห้องประชุม มาลีรัก',NULL)
-- (58,40,206,'2026-02-09 08:48:13',NULL,'ยืมผ่านระบบ','จัดให้คู่กับคอม บ.8/2560',NULL)
-- (59,40,207,'2026-02-11 02:13:11',NULL,'ยืมผ่านระบบ',' จัดให้คู่กับคอม บ.8/2560',NULL)
-- (64,44,230,'2026-02-17 03:11:24',NULL,'ยืมผ่านระบบ','นำไปต่อใช้งานที่ ชั้น 3 กบฟ.',NULL)

DROP TABLE IF EXISTS borrowing_files;
CREATE TABLE borrowing_files (
  file_id int NOT NULL GENERATED ALWAYS AS IDENTITY,
  log_id int NOT NULL,
  file_name varchar(255) NOT NULL,
  file_path varchar(255) NOT NULL,
  file_type varchar(50) DEFAULT NULL,
  created_at timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (file_id)
,
  CONSTRAINT fk_borrowing_log FOREIGN KEY (log_id) REFERENCES borrowing_logs (log_id) ON DELETE CASCADE
)  ;


CREATE INDEX fk_borrowing_log ON borrowing_files (log_id);

-- The following rows are commented out because log_id does not exist in borrowing_logs table:
-- (10,58,'à¹à¸­à¸à¸¢à¹à¸²à¸¢à¸à¸£à¸±à¸à¸¢à¹à¸ªà¸´à¸ hp à¸.8-2560 à¸à¸à¸ª.à¸à¸à¸¥ 514760.pdf','/uploads/borrowing/22cd62da-193c-4de6-bdd8-f050ac08da11.pdf','application/pdf','2026-02-09 08:48:13')
-- (11,59,'à¹à¸­à¸à¸¢à¹à¸²à¸¢à¸à¸£à¸±à¸à¸¢à¹à¸ªà¸´à¸ hp à¸.8-2560 à¸à¸à¸ª.à¸à¸à¸¥ 514760.pdf','/uploads/borrowing/51584bd1-735b-43d0-a660-77591e71d15e.pdf','application/pdf','2026-02-11 02:13:11')

DROP TABLE IF EXISTS borrowing_logs CASCADE;
CREATE TABLE borrowing_logs (
  log_id int NOT NULL GENERATED ALWAYS AS IDENTITY,
  employee_id int DEFAULT NULL,
  item_id int DEFAULT NULL,
  borrow_date timestamp(0) DEFAULT CURRENT_TIMESTAMP,
  return_date timestamp(0) DEFAULT NULL,
  note text,
  purpose varchar(255) DEFAULT NULL,
  admin_id int DEFAULT NULL,
  PRIMARY KEY (log_id)
,
  CONSTRAINT borrowing_logs_ibfk_1 FOREIGN KEY (employee_id) REFERENCES employees (id),
  CONSTRAINT borrowing_logs_ibfk_2 FOREIGN KEY (item_id) REFERENCES items (item_id),
  CONSTRAINT fk_admin_log FOREIGN KEY (admin_id) REFERENCES admins (admin_id),
  CONSTRAINT fk_log_admin FOREIGN KEY (admin_id) REFERENCES admins (admin_id)
)  ;


CREATE INDEX employee_id ON borrowing_logs (employee_id);
CREATE INDEX item_id ON borrowing_logs (item_id);
CREATE INDEX fk_admin_log ON borrowing_logs (admin_id);

-- The following rows are commented out because item_id does not exist in items table:
-- (46,30,190,'2026-02-04 05:25:53',NULL,'ยืมผ่านระบบ','switc ไม่สามารถใช้งานได้เลยต้องยืมจาก ผคข.กดส.ฉ.2 ใช้งาน ชั่วคราว',NULL)
-- (50,34,195,'2026-02-06 03:36:57',NULL,'ยืมผ่านระบบ','ห้องประชุม มาลีรัก',NULL)
-- (58,40,206,'2026-02-09 08:48:13',NULL,'ยืมผ่านระบบ','จัดให้คู่กับคอม บ.8/2560',NULL)
-- (59,40,207,'2026-02-11 02:13:11',NULL,'ยืมผ่านระบบ',' จัดให้คู่กับคอม บ.8/2560',NULL)
-- (64,44,230,'2026-02-17 03:11:24',NULL,'ยืมผ่านระบบ','นำไปต่อใช้งานที่ ชั้น 3 กบฟ.',NULL)

DROP TABLE IF EXISTS categories CASCADE;
CREATE TABLE categories (
  cat_id int NOT NULL,
  item_type varchar(255) DEFAULT NULL,
  PRIMARY KEY (cat_id)
) ;

INSERT INTO categories VALUES (1,'Computer'),(2,'อุปกรณ์สำนักงาน'),(3,'Network'),(4,'อะไหล่คอมพิวเตอร์'),(5,'สื่อบันทึกข้อมูล'),(6,'เครื่องมือช่าง'),(7,'เครื่องพิมพ์เอกสาร'),(8,'Mouse & Keyboard');

DROP TABLE IF EXISTS employees CASCADE;
CREATE TABLE employees (
  id int NOT NULL GENERATED ALWAYS AS IDENTITY,
  first_name varchar(50) NOT NULL,
  last_name varchar(50) DEFAULT NULL,
  employees_code varchar(10) DEFAULT NULL,
    phone_number varchar(12) DEFAULT NULL,
  Affiliation varchar(20) DEFAULT NULL,
  created_at timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  role_id int DEFAULT NULL,
  PRIMARY KEY (id)
,
  CONSTRAINT fk_emp_role FOREIGN KEY (role_id) REFERENCES roles (role_id)
)  ;


CREATE INDEX fk_emp_role ON employees (role_id);
INSERT INTO employees OVERRIDING SYSTEM VALUE VALUES (30,'นางสาวมลฤดี','ใหลหลั่ง','9008842','045-481-197','การไฟฟ้าตระการพืชผล','2026-02-04 05:25:53',2),(34,'-','-','-','-','-','2026-02-06 03:36:57',2),(35,'ำดำ','ดำ','ดำด','ำดำ','ดำด','2026-02-07 04:07:10',2),(36,'หก','หก','หกห','กหกห','กหกห','2026-02-07 04:12:03',2),(37,'หก','หกหกห','กหก','หกห','กหก','2026-02-07 04:14:45',2),(38,'กห','กหก','หกหก','หก','หกหก','2026-02-07 04:17:50',2),(39,'sdsds','dsdsd','dsds','sds','dsd','2026-02-07 04:24:32',2),(40,'นายองกรณ์','นามโครตร','514760','ไม่มี','กฟส.บจล.','2026-02-09 08:48:13',2),(41,'kkk','kkk','kk','kkk','kkk','2026-02-11 09:22:34',2),(42,'x','sxs','sx','sxs','xsx','2026-02-13 05:53:40',2),(43,'ธีระชัย','ยนวว','วววว','วววว','ววว','2026-02-17 02:44:39',2),(44,'น.ส.ภัทรวดี','กิ่งมาลา','515106','0659165791','ผสห.กบพ.','2026-02-17 03:11:24',2);


--
-- SQLINES DEMO *** or table `repair`
--

DROP TABLE IF EXISTS repair CASCADE;
/* SQLINES DEMO *** d_cs_client     = @@character_set_client */;
/* SQLINES DEMO *** cter_set_client = utf8mb4 */;
CREATE TABLE repair (
  repair_id int NOT NULL GENERATED ALWAYS AS IDENTITY,
  brand varchar(50) DEFAULT NULL,
  contract_number varchar(50) DEFAULT NULL,
  serial_number varchar(50) DEFAULT NULL,
  asset_number varchar(50) DEFAULT NULL,
  affiliation varchar(50) DEFAULT NULL,
  problem varchar(50) DEFAULT NULL,
  status varchar(30) check (status in ('Pending','In Progress','Fixed','Unfixable')) DEFAULT 'Pending',
  repair_url varchar(255) DEFAULT NULL,
  employee_id int DEFAULT NULL,
  item_id int DEFAULT NULL,
  created_at timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP /* ON UPDATE CURRENT_TIMESTAMP */,
  employee_name varchar(255) DEFAULT NULL,
  employees_code varchar(50) DEFAULT NULL,
  phone_number varchar(20) DEFAULT NULL,
  finished_at timestamp(0) DEFAULT NULL,
  evidence_file varchar(255) DEFAULT NULL,
  Procedure varchar(100) DEFAULT NULL,
  report_url varchar(255) DEFAULT NULL,
  PRIMARY KEY (repair_id)
,
  CONSTRAINT fk_repair_item FOREIGN KEY (item_id) REFERENCES items (item_id) ON DELETE CASCADE
)  ;

/* SQLINES DEMO *** cter_set_client = @saved_cs_client */;

CREATE INDEX fk_repair_employee ON repair (employee_id);
CREATE INDEX fk_repair_item ON repair (item_id);

--
-- SQLINES DEMO *** table `repair`
--

-- The following rows are commented out because item_id does not exist in items table:
-- INSERT INTO repair OVERRIDING SYSTEM VALUE VALUES (243,'hp ','บ.8/2560','250696','57485858','วดวกกวด/ใ','ระกวพยม','Fixed',NULL,NULL,238,'2026-02-24 08:17:07','2026-02-24 09:23:02','บยกาดงดยดว','วกววำวำวำ','กากสกวำบ','2026-02-24 09:23:02',NULL,'กดดก','e2cd0507-02a4-400d-8251-7dba28b233a4.pdf'),(244,'หกหก','กหก','หก','หกห','กหก','หกหก','In Progress',NULL,NULL,NULL,'2026-02-24 09:28:32','2026-02-24 09:31:29','หกห','กหก','หกห',NULL,NULL,NULL,NULL);
-- INSERT INTO repair VALUES (243,'hp ','บ.8/2560','250696','57485858','วดวกกวด/ใ','ระกวพยม','Fixed',NULL,NULL,238,'2026-02-24 08:17:07','2026-02-24 09:23:02','บยกาดงดยดว','วกววำวำวำ','กากสกวำบ','2026-02-24 09:23:02',NULL,'กดดก','e2cd0507-02a4-400d-8251-7dba28b233a4.pdf'),(244,'หกหก','กหก','หก','หกห','กหก','หกหก','In Progress',NULL,NULL,NULL,'2026-02-24 09:28:32','2026-02-24 09:31:29','หกห','กหก','หกห',NULL,NULL,NULL,NULL);

DROP TABLE IF EXISTS item_repair;
CREATE TABLE item_repair (
  archive_id int NOT NULL GENERATED ALWAYS AS IDENTITY,
  repair_id int NOT NULL,
  item_id int NOT NULL,
  archived_at timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (archive_id)
,
  CONSTRAINT fk_item FOREIGN KEY (item_id) REFERENCES items (item_id),
  CONSTRAINT fk_repair FOREIGN KEY (repair_id) REFERENCES repair (repair_id)
)  ;

CREATE INDEX fk_repair ON item_repair (repair_id);
CREATE INDEX fk_item ON item_repair (item_id);

-- The following rows are commented out because item_id does not exist in items table:
-- INSERT INTO item_repair OVERRIDING SYSTEM VALUE VALUES (3,243,238,'2026-02-24 08:44:31'),(4,243,238,'2026-02-24 09:23:02');

DROP TABLE IF EXISTS items CASCADE;
CREATE TABLE items (
  item_id int NOT NULL GENERATED ALWAYS AS IDENTITY,
  item_name varchar(100) NOT NULL,
  asset_number varchar(50) DEFAULT NULL,
  serial_number varchar(100) DEFAULT NULL,
  cat_id int DEFAULT NULL,
  status varchar(30) check (status in ('Available','Borrowed','Maintenance','Broken','Scrapped')) NOT NULL,
  created_at timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  image_url varchar(255) DEFAULT 'default_device.png',
  contract_number varchar(100) DEFAULT NULL,
  PRIMARY KEY (item_id),
  CONSTRAINT serial_number UNIQUE (serial_number)
,
  CONSTRAINT fk_category FOREIGN KEY (cat_id) REFERENCES categories (cat_id)
)  ;


CREATE INDEX fk_category ON items (cat_id);
CREATE INDEX idx_item_name ON items (item_name);
CREATE INDEX idx_contract_number ON items (contract_number);
CREATE INDEX idx_serial_number ON items (serial_number);


--
-- SQLINES DEMO *** or table `repair`
--

DROP TABLE IF EXISTS repair CASCADE;
/* SQLINES DEMO *** d_cs_client     = @@character_set_client */;
/* SQLINES DEMO *** cter_set_client = utf8mb4 */;
CREATE TABLE repair (
  repair_id int NOT NULL GENERATED ALWAYS AS IDENTITY,
  brand varchar(50) DEFAULT NULL,
  contract_number varchar(50) DEFAULT NULL,
  serial_number varchar(50) DEFAULT NULL,
  asset_number varchar(50) DEFAULT NULL,
  affiliation varchar(50) DEFAULT NULL,
  problem varchar(50) DEFAULT NULL,
  status varchar(30) check (status in ('Pending','In Progress','Fixed','Unfixable')) DEFAULT 'Pending',
  repair_url varchar(255) DEFAULT NULL,
  employee_id int DEFAULT NULL,
  item_id int DEFAULT NULL,
  created_at timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP /* ON UPDATE CURRENT_TIMESTAMP */,
  employee_name varchar(255) DEFAULT NULL,
  employees_code varchar(50) DEFAULT NULL,
  phone_number varchar(20) DEFAULT NULL,
  finished_at timestamp(0) DEFAULT NULL,
  evidence_file varchar(255) DEFAULT NULL,
  Procedure varchar(100) DEFAULT NULL,
  report_url varchar(255) DEFAULT NULL,
  PRIMARY KEY (repair_id)
,
  CONSTRAINT fk_repair_item FOREIGN KEY (item_id) REFERENCES items (item_id) ON DELETE CASCADE
)  ;

/* SQLINES DEMO *** cter_set_client = @saved_cs_client */;

CREATE INDEX fk_repair_employee ON repair (employee_id);
CREATE INDEX fk_repair_item ON repair (item_id);

--
-- SQLINES DEMO *** table `repair`
--

-- The following rows are commented out because item_id does not exist in items table:
-- INSERT INTO repair OVERRIDING SYSTEM VALUE VALUES (243,'hp ','บ.8/2560','250696','57485858','วดวกกวด/ใ','ระกวพยม','Fixed',NULL,NULL,238,'2026-02-24 08:17:07','2026-02-24 09:23:02','บยกาดงดยดว','วกววำวำวำ','กากสกวำบ','2026-02-24 09:23:02',NULL,'กดดก','e2cd0507-02a4-400d-8251-7dba28b233a4.pdf'),(244,'หกหก','กหก','หก','หกห','กหก','หกหก','In Progress',NULL,NULL,NULL,'2026-02-24 09:28:32','2026-02-24 09:31:29','หกห','กหก','หกห',NULL,NULL,NULL,NULL);
-- INSERT INTO repair VALUES (243,'hp ','บ.8/2560','250696','57485858','วดวกกวด/ใ','ระกวพยม','Fixed',NULL,NULL,238,'2026-02-24 08:17:07','2026-02-24 09:23:02','บยกาดงดยดว','วกววำวำวำ','กากสกวำบ','2026-02-24 09:23:02',NULL,'กดดก','e2cd0507-02a4-400d-8251-7dba28b233a4.pdf'),(244,'หกหก','กหก','หก','หกห','กหก','หกหก','In Progress',NULL,NULL,NULL,'2026-02-24 09:28:32','2026-02-24 09:31:29','หกห','กหก','หกห',NULL,NULL,NULL,NULL);

-- ...existing code...

