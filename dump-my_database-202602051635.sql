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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `borrowing_logs`
--

LOCK TABLES `borrowing_logs` WRITE;
/*!40000 ALTER TABLE `borrowing_logs` DISABLE KEYS */;
INSERT INTO `borrowing_logs` VALUES (46,30,190,'2026-02-04 05:25:53',NULL,'ยืมผ่านระบบ','switc ไม่สามารถใช้งานได้เลยต้องยืมจาก ผคข.กดส.ฉ.2 ใช้งาน ชั่วคราว',NULL);
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
INSERT INTO `categories` VALUES (1,'Computer'),(2,'อุปกรณ์สำนักงาน'),(3,'Network'),(4,'อะไหล่คอมพิวเตอร์'),(5,'สื่อบันทึกข้อมูล'),(6,'เครื่องมือช่าง'),(7,'เครื่องพิมพ์เอกสาร');
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
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,'สมหญิง','ใจดี',NULL,NULL,'ผปด.กดส.ฉ.2','2026-01-07 06:13:40',2),(2,'Thirachai','Phurahong','477432','0626400502','ผคข.กดส.ฉ.2','2026-01-13 04:29:24',2),(3,'ธีระชัย',NULL,NULL,NULL,NULL,'2026-01-20 01:38:38',2),(4,'สมสัก',NULL,NULL,NULL,NULL,'2026-01-20 01:39:18',2),(5,'สมศรี','ศรีมณี','9004940','0615615615','กสข.กฟฉ.2','2026-01-20 03:08:09',2),(6,'ธีระชัย','ภู่ระหงษ์','447489','062-6400-502','ผคข.กดส.ฉ2','2026-01-20 03:13:07',2),(7,'ธีระชัย','ภู่ระหงษ์','459874','064-6400-364','ผคข.กดส.ฉ.2','2026-01-20 06:07:32',2),(8,'ดก','ดกดก','ดกดกด','กดกด','กดกดกด','2026-01-20 10:16:25',2),(9,'มงคล','กิต','440503','062-6400-502','กดส.ฉ.2','2026-01-20 10:20:04',2),(10,'หกห','หกหก','หกหก','หกห','กหกห','2026-01-20 10:21:28',2),(11,'wewe','wewe','wewe','ewew','wewe','2026-01-20 10:33:08',2),(12,'sds','dsd','sdsd','sdsd','sdsds','2026-01-21 02:23:39',2),(13,'we','er','erre','ere','erer','2026-01-21 09:55:16',2),(14,'ศิรินทร','ทรัพย์ทวีจินดา','508830','0883413629','ผสร.กบพ.ฉ.2','2026-01-22 03:40:22',2),(15,'ดเดเด','เดเดเ','ดเดเด','ดเดเดเด','เดเดเด','2026-01-28 04:22:37',2),(16,'กดกด','กดดกด','กดกด','กดกดก','ดกดกด','2026-01-28 04:22:52',2),(17,'กหกหก','หกหกห','กหก','หกหก','หกหก','2026-01-28 04:32:03',2),(18,'ำพ','ำพำพ','ำพำพ','พำพ','ำพำพำพ','2026-01-28 05:57:02',2),(19,'ๅๅๅ','ๅๅๅๅ','ๅๅๅ','ๅๅๅๅ','ๅๅๅๅๅ','2026-01-28 06:01:41',2),(20,'พำพำ','ำพำพำพำ','ำพำพำพ','พำพำพำ','พำพำพำพ','2026-01-28 06:03:41',2),(21,'กเดกเ','กดเกดเ','กดเกดเกด','กดเกดเกด','เกดเกดเ','2026-01-28 07:48:09',2),(22,'ดกดกด','กดกดก','ดกดก','กดกด','กดกดกดก','2026-01-28 08:11:37',2),(23,'กดกด','กดกด','กดก','กดกด','กดกดกด','2026-01-28 08:11:44',2),(24,'ดกดกด','กดกดกด','กดกดกด','ดกดกด','ดกดกด','2026-01-28 08:33:45',2),(25,'sdsd','sds','dsds','sdsd','sdsd','2026-01-29 05:13:17',2),(26,'sds','sdsd','sds','dsd','sdsd','2026-01-29 07:37:23',2),(27,'weweweww','wewewewewe','wewwewweww','wewewewe','wewewewe','2026-01-31 05:13:09',2),(28,'sdsds','dsds','dsdsds','sdss','dsd','2026-01-31 05:15:27',2),(29,'ธีระชัย','ภู่ระหงษ์','448767','10366','ผคข.กดส.ฉ.2','2026-01-31 05:32:23',2),(30,'นางสาวมลฤดี','ใหลหลั่ง','9008842','045-481-197','การไฟฟ้าตระการพืชผล','2026-02-04 05:25:53',2),(31,'kkkkkk','','448444','','','2026-02-04 08:23:12',2),(32,'','','2245454','','','2026-02-04 08:45:53',2),(33,'asas','asasa','sasas','asas','asas','2026-02-04 09:15:53',2);
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
) ENGINE=InnoDB AUTO_INCREMENT=205 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES (182,'Switch 8-Port tp-link','','225A0PT010192',3,'Available','2026-02-04 04:59:52','item-1770181192841.png',''),(187,'Switch 8-Port tp-link',' ','2259394004711',3,'Available','2026-02-04 05:08:35','item-1770181715687.png',''),(189,'Switch 8-Port tp-link','','225A0PT010093',3,'Available','2026-02-04 05:17:14','item-1770182234091.png',''),(190,'Switch 8-Port tp-link','','225A0PT010099',3,'Borrowed','2026-02-04 05:18:13','item-1770182293080.png',''),(191,'Switch 8-Port tp-link','','225A0PT010382',3,'Available','2026-02-04 05:43:08','item-1770183788207.png',''),(192,'Switch 8-Port tp-link','','225A0PT010102',3,'Available','2026-02-04 05:44:35','item-1770183875816.png',''),(193,'Switch 8-Port tp-link','','225A0PT010384',3,'Available','2026-02-04 06:58:09','item-1770188289827.png',''),(194,'Switch 8-Port tp-link','','225A0PT010371',3,'Available','2026-02-04 06:58:39','item-1770188319812.png',''),(195,'Switch 8-Port tp-link','','225A0PT010094',3,'Available','2026-02-04 06:59:23','item-1770188363459.png',''),(196,'Switch 8-Port tp-link','','225A0PT010106',3,'Available','2026-02-04 07:00:24','item-1770188424829.png',''),(197,'wd green 480gb','','24250N800562',4,'Available','2026-02-05 03:34:43','e27f4f80-3dbf-4b6e-a071-164db15362ff.jpg',''),(198,'wd green 480gb','','24250N800645',1,'Available','2026-02-05 03:38:14','eb157b30-9eb5-4774-ac68-c0cbea51d5fb.jpg',''),(199,'wd green 480gb','','24250N803435',4,'Available','2026-02-05 03:38:37','7eb8d661-ae72-47b1-95f1-28e69976abac.jpg',''),(200,'wd green 480gb','','24250N801220',4,'Available','2026-02-05 03:38:54','ccb9dec0-a73a-47f6-b911-fd6a5103a756.jpg',''),(201,'wd green 480gb','','242301A0012E',4,'Available','2026-02-05 04:39:34','d84bab7a-d9c6-4191-b567-ab7be717b8bc.jpg',''),(202,'wd green 480gb','','24250N800696',4,'Available','2026-02-05 04:40:10','78f5b2b3-bc19-4756-ba3d-7e3e03eb3141.jpg',''),(203,'oric m.2 ssd Enclosure','','6942227106223',5,'Available','2026-02-05 06:45:18','7c7e5c91-8214-447f-9b0f-9ba7c1adc94f.png',''),(204,'ugreen ชุดไขคว้า','','SN2500125057507',6,'Available','2026-02-05 06:47:44','f097675d-9833-4ef1-9fb3-e18f7cc87145.png','');
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
  PRIMARY KEY (`repair_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repair`
--

LOCK TABLES `repair` WRITE;
/*!40000 ALTER TABLE `repair` DISABLE KEYS */;
INSERT INTO `repair` VALUES (1,'hp',NULL,'123456','532323551','ผคช.','เปิดไม่ติด');
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

-- Dump completed on 2026-02-05 16:35:58
