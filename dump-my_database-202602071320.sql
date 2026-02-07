-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: my_database
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `admin_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (1,'THI1411','123456',NULL,'2026-01-07 06:12:50');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `borrowing_files`
--

DROP TABLE IF EXISTS `borrowing_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `borrowing_files` (
  `file_id` int NOT NULL AUTO_INCREMENT,
  `log_id` int NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`file_id`),
  KEY `fk_borrowing_log` (`log_id`),
  CONSTRAINT `fk_borrowing_log` FOREIGN KEY (`log_id`) REFERENCES `borrowing_logs` (`log_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `borrowing_files`
--

LOCK TABLES `borrowing_files` WRITE;
/*!40000 ALTER TABLE `borrowing_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `borrowing_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `borrowing_logs`
--

DROP TABLE IF EXISTS `borrowing_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `borrowing_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int DEFAULT NULL,
  `item_id` int DEFAULT NULL,
  `borrow_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `return_date` datetime DEFAULT NULL,
  `note` text,
  `purpose` varchar(255) DEFAULT NULL,
  `admin_id` int DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  KEY `employee_id` (`employee_id`),
  KEY `item_id` (`item_id`),
  KEY `fk_admin_log` (`admin_id`),
  CONSTRAINT `borrowing_logs_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `borrowing_logs_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`),
  CONSTRAINT `fk_admin_log` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`),
  CONSTRAINT `fk_log_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `borrowing_logs`
--

LOCK TABLES `borrowing_logs` WRITE;
/*!40000 ALTER TABLE `borrowing_logs` DISABLE KEYS */;
INSERT INTO `borrowing_logs` VALUES (46,30,190,'2026-02-04 05:25:53',NULL,'ยืมผ่านระบบ','switc ไม่สามารถใช้งานได้เลยต้องยืมจาก ผคข.กดส.ฉ.2 ใช้งาน ชั่วคราว',NULL),(50,34,195,'2026-02-06 03:36:57',NULL,'ยืมผ่านระบบ','ห้องประชุม มาลีรัก',NULL);
/*!40000 ALTER TABLE `borrowing_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `cat_id` int NOT NULL,
  `item_type` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`cat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Computer'),(2,'อุปกรณ์สำนักงาน'),(3,'Network'),(4,'อะไหล่คอมพิวเตอร์'),(5,'สื่อบันทึกข้อมูล'),(6,'เครื่องมือช่าง'),(7,'เครื่องพิมพ์เอกสาร'),(8,'Mouse & Keyboard');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `employees_code` varchar(10) DEFAULT NULL,
  `phone_number` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Affiliation` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `role_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_emp_role` (`role_id`),
  CONSTRAINT `fk_emp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (30,'นางสาวมลฤดี','ใหลหลั่ง','9008842','045-481-197','การไฟฟ้าตระการพืชผล','2026-02-04 05:25:53',2),(34,'-','-','-','-','-','2026-02-06 03:36:57',2),(35,'ำดำ','ดำ','ดำด','ำดำ','ดำด','2026-02-07 04:07:10',2),(36,'หก','หก','หกห','กหกห','กหกห','2026-02-07 04:12:03',2),(37,'หก','หกหกห','กหก','หกห','กหก','2026-02-07 04:14:45',2),(38,'กห','กหก','หกหก','หก','หกหก','2026-02-07 04:17:50',2),(39,'sdsds','dsdsd','dsds','sds','dsd','2026-02-07 04:24:32',2);
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `item_name` varchar(100) NOT NULL,
  `asset_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `cat_id` int DEFAULT NULL,
  `status` enum('Available','Borrowed','Repair') DEFAULT 'Available',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `image_url` varchar(255) DEFAULT 'default_device.png',
  `contract_number` varchar(100) DEFAULT NULL COMMENT 'เลขที่สัญญา',
  PRIMARY KEY (`item_id`),
  UNIQUE KEY `serial_number` (`serial_number`),
  KEY `fk_category` (`cat_id`),
  KEY `idx_item_name` (`item_name`),
  KEY `idx_contract_number` (`contract_number`),
  KEY `idx_serial_number` (`serial_number`),
  CONSTRAINT `fk_category` FOREIGN KEY (`cat_id`) REFERENCES `categories` (`cat_id`)
) ENGINE=InnoDB AUTO_INCREMENT=229 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES (182,'Switch 8-Port tp-link','','225A0PT010192',3,'Available','2026-02-04 04:59:52','item-1770181192841.png',''),(187,'Switch 8-Port tp-link',' ','2259394004711',3,'Available','2026-02-04 05:08:35','item-1770181715687.png',''),(189,'Switch 8-Port tp-link','','225A0PT010093',3,'Available','2026-02-04 05:17:14','item-1770182234091.png',''),(190,'Switch 8-Port tp-link','','225A0PT010099',3,'Borrowed','2026-02-04 05:18:13','item-1770182293080.png',''),(191,'Switch 8-Port tp-link','','225A0PT010382',3,'Available','2026-02-04 05:43:08','item-1770183788207.png',''),(192,'Switch 8-Port tp-link','','225A0PT010102',3,'Available','2026-02-04 05:44:35','item-1770183875816.png',''),(193,'Switch 8-Port tp-link','','225A0PT010384',3,'Available','2026-02-04 06:58:09','item-1770188289827.png',''),(194,'Switch 8-Port tp-link','','225A0PT010371',3,'Available','2026-02-04 06:58:39','item-1770188319812.png',''),(195,'Switch 8-Port tp-link','','225A0PT010094',3,'Borrowed','2026-02-04 06:59:23','item-1770188363459.png',''),(196,'Switch 8-Port tp-link','','225A0PT010106',3,'Available','2026-02-04 07:00:24','item-1770188424829.png',''),(197,'wd green 480gb','','24250N800562',4,'Available','2026-02-05 03:34:43','e27f4f80-3dbf-4b6e-a071-164db15362ff.jpg',''),(198,'wd green 480gb','','24250N800645',1,'Available','2026-02-05 03:38:14','eb157b30-9eb5-4774-ac68-c0cbea51d5fb.jpg',''),(199,'wd green 480gb','','24250N803435',4,'Available','2026-02-05 03:38:37','7eb8d661-ae72-47b1-95f1-28e69976abac.jpg',''),(200,'wd green 480gb','','24250N801220',4,'Available','2026-02-05 03:38:54','ccb9dec0-a73a-47f6-b911-fd6a5103a756.jpg',''),(201,'wd green 480gb','','242301A0012E',4,'Available','2026-02-05 04:39:34','d84bab7a-d9c6-4191-b567-ab7be717b8bc.jpg',''),(202,'wd green 480gb','','24250N800696',4,'Available','2026-02-05 04:40:10','78f5b2b3-bc19-4756-ba3d-7e3e03eb3141.jpg',''),(203,'oric m.2 ssd Enclosure','','6942227106223',5,'Available','2026-02-05 06:45:18','7c7e5c91-8214-447f-9b0f-9ba7c1adc94f.png',''),(204,'ugreen ชุดไขคว้า','','SN2500125057507',6,'Available','2026-02-05 06:47:44','f097675d-9833-4ef1-9fb3-e18f7cc87145.png',''),(206,'logitech B100','','2541APX8WL99',8,'Available','2026-02-06 04:41:51','a7bb61ae-6738-4c24-9c43-2212a58954bd.jpg',''),(207,'logitech k120','','2533MR535NM9',8,'Available','2026-02-06 04:43:15','0a9b6cde-6816-47ee-b12d-a336103fcef4.jpg',''),(208,'logitech k120','','2549MR806ZJ9',8,'Available','2026-02-06 04:45:57','a08d83a1-3d8d-43eb-aa7c-7325c8413288.jpg',''),(209,'logitech k120','','2549MRH06ZK9',8,'Available','2026-02-06 04:46:20','7f0f5c01-077e-4acb-a804-0efcaa166944.jpg',''),(210,'logitech k120','','2533MRA35NK9',8,'Available','2026-02-06 04:46:52','30cae5a1-2aa0-45f5-a59a-95575827b0a8.jpg',''),(211,'logitech k120','','2549MRG04K19',8,'Available','2026-02-06 04:48:00','0ca00ef7-16e6-42f7-b9bc-d9086ea06ba1.jpg',''),(212,'logitech k120','','2549MR306Z69',8,'Available','2026-02-06 04:48:23','1f5b4776-1cf3-47cb-a44c-595a978d6247.jpg',''),(213,'logitech k120','','2549MRQ06ZH9',8,'Available','2026-02-06 04:48:58','f3fb9e05-fbe4-441b-a9b2-1a465ae37f6d.jpg',''),(214,'logitech k120','','2549MRD06ZG9',8,'Available','2026-02-06 04:49:23','ef51f22e-137f-4128-84c8-038697e1b783.jpg',''),(215,'logitech B100','','2541APJ8WL49',8,'Available','2026-02-06 04:50:50','f0fead7e-1674-44d6-bb1b-637f139fc033.jpg',''),(216,'logitech B100','','2544AP3B3L59',8,'Available','2026-02-06 04:51:20','32df2e18-98e0-4b1f-8a50-eb1cdcb3357d.jpg',''),(217,'logitech B100','','2541APU8WLA9',8,'Available','2026-02-06 04:51:49','2851ac79-1af9-48b2-aed3-e493d7645949.jpg',''),(218,'logitech B100','','2544AP9B1Z29',8,'Available','2026-02-06 04:52:17','2739b3cf-ed6c-4ad3-b51e-6d401c89782e.jpg',''),(219,'logitech B100','','2541APN8K679',8,'Available','2026-02-06 04:52:41','548ada23-49ee-4e00-975b-22e12da75e35.jpg',''),(220,'logitech B100','','2541AP38WL89',8,'Available','2026-02-06 04:53:08','c920b895-782b-4a63-a8e8-050030b01d7b.jpg',''),(221,'logitech B100','','2541APW95LG9',8,'Available','2026-02-06 04:53:46','836e74ea-4183-4739-8c98-7f93cbb1d496.jpg',''),(222,'logitech B100','','2541AP495RX9',8,'Available','2026-02-06 04:54:38','3f036b74-3393-46d1-96a3-21c1a655a17f.jpg',''),(223,'logitech B100','','2544APABEA09',8,'Available','2026-02-06 04:55:16','7fe56ac4-1832-43b1-934e-d8ecfb902ae1.jpg',''),(224,'logitech B100','','2544APJB1YJ9',8,'Available','2026-02-06 04:55:42','1a77024a-d32d-49e8-bc31-8a0e9b02b08e.jpg',''),(225,'logitech B100','','2544AP5B1Z39',8,'Available','2026-02-06 04:56:04','ec386c4e-bafe-476e-8edc-dac134f2e4be.jpg',''),(226,'logitech B100','','2544AP9B1YW9',8,'Available','2026-02-06 04:56:30','471923fd-17a0-4c5a-a8a5-6ea107afdea5.jpg',''),(227,'logitech B100','','2541APF95KY9',8,'Available','2026-02-06 04:56:56','e0e41fa7-48d9-4386-b0ae-da72d9f3d98c.jpg',''),(228,'logitech B100','','2541AP38WKW9',8,'Available','2026-02-06 04:57:30','56a26683-4258-4a5d-b9d4-b52df4cf48cf.jpg','');
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `repair`
--

DROP TABLE IF EXISTS `repair`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `repair` (
  `repair_id` int NOT NULL AUTO_INCREMENT,
  `brand` varchar(50) DEFAULT NULL,
  `contract_number` varchar(50) DEFAULT NULL,
  `serial_number` varchar(50) DEFAULT NULL,
  `asset_number` varchar(50) DEFAULT NULL,
  `affiliation` varchar(50) DEFAULT NULL,
  `problem` varchar(50) DEFAULT NULL,
  `repair_url` varchar(255) DEFAULT NULL,
  `employee_id` int DEFAULT NULL,
  `employee_name` varchar(255) DEFAULT NULL,
  `employees_code` varchar(50) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `item_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`repair_id`),
  KEY `fk_repair_employee` (`employee_id`),
  KEY `fk_repair_item` (`item_id`),
  CONSTRAINT `fk_repair_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repair`
--

LOCK TABLES `repair` WRITE;
/*!40000 ALTER TABLE `repair` DISABLE KEYS */;
INSERT INTO `repair` VALUES (1,'hp',NULL,'123456','532323551','ผคช.','เปิดไม่ติด',NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-07 05:13:35','2026-02-07 05:13:35'),(11,'sds','sds','dsd','sdsd','dsd','dsd','/uploads/repairs/5a57cdcb-75e1-4687-bed3-66250a5b075e.pdf',NULL,NULL,NULL,NULL,NULL,'2026-02-07 05:13:35','2026-02-07 05:13:35'),(12,'sdsd','sds','sds','dsd','dsd','sd','/uploads/repairs/838eb1c6-6378-41a9-bb68-ea9c05dd81b3.pdf',NULL,NULL,NULL,NULL,NULL,'2026-02-07 05:13:35','2026-02-07 05:13:35'),(13,'Test','','','','','Not working',NULL,34,NULL,NULL,NULL,NULL,'2026-02-07 05:13:35','2026-02-07 05:13:35'),(14,'Test','','','','','NotWorking',NULL,34,NULL,NULL,NULL,NULL,'2026-02-07 05:13:35','2026-02-07 05:13:35'),(16,'dfdf','df','df','dfdf','dfd','fdf','/uploads/repairs/ec887ab1-50b9-4ead-aed4-040a8029fab1.jpg',NULL,NULL,NULL,NULL,NULL,'2026-02-07 05:47:33','2026-02-07 05:47:33'),(17,'fdfd','fd','dfd','dfd','fdf','df','/uploads/repairs/122a6da2-2c25-4126-afb8-c1cda0019eda.pdf,/uploads/repairs/27fbc5f1-e5ee-4a87-8f5d-986a65466e10.pdf,/uploads/repairs/b44133ef-dff8-4642-a099-cd4dc9aa9b70.jpg,/uploads/repairs/a362c838-21e6-41e6-bbc1-17b0341c6bc7.pdf',NULL,NULL,NULL,NULL,NULL,'2026-02-07 05:48:03','2026-02-07 05:48:03'),(18,'หกหก','หกหกห','หกห','กห','กหกห','กหกหก','/uploads/repairs/ba2113fb-ddd8-439f-9b7b-4ac4fae6741d.jpg',NULL,NULL,NULL,NULL,NULL,'2026-02-07 06:08:34','2026-02-07 06:08:34');
/*!40000 ALTER TABLE `repair` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  `borrow_limit` int DEFAULT '3',
  PRIMARY KEY (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Admin',99),(2,'Staff',3);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'my_database'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-07 13:20:30
