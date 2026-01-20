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
INSERT INTO `admins` VALUES (1,'admin01','123456',NULL,'2026-01-07 06:12:50');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
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
  `admin_id` int DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  KEY `employee_id` (`employee_id`),
  KEY `item_id` (`item_id`),
  KEY `fk_admin_log` (`admin_id`),
  CONSTRAINT `borrowing_logs_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `borrowing_logs_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`),
  CONSTRAINT `fk_admin_log` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`),
  CONSTRAINT `fk_log_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `borrowing_logs`
--

LOCK TABLES `borrowing_logs` WRITE;
/*!40000 ALTER TABLE `borrowing_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `borrowing_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `cat_id` int NOT NULL AUTO_INCREMENT,
  `cat_name` varchar(50) NOT NULL,
  PRIMARY KEY (`cat_id`),
  UNIQUE KEY `cat_name` (`cat_name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'IT Equipment'),(2,'Office Supplies');
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
  `phone_number` varchar(10) DEFAULT NULL,
  `Affiliation` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `role_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_emp_role` (`role_id`),
  CONSTRAINT `fk_emp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,'สมหญิง','ใจดี',NULL,NULL,'ผปด.กดส.ฉ.2','2026-01-07 06:13:40',2),(2,'Thirachai','Phurahong','477432','0626400502','ผคข.กดส.ฉ.2','2026-01-13 04:29:24',2);
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
  `asset_number` varchar(50) NOT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `item_type` varchar(50) DEFAULT NULL,
  `cat_id` int DEFAULT NULL,
  `status` enum('Available','Borrowed','Repair') DEFAULT 'Available',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `image_url` varchar(255) DEFAULT 'default_device.png',
  PRIMARY KEY (`item_id`),
  UNIQUE KEY `asset_number` (`asset_number`),
  UNIQUE KEY `serial_number` (`serial_number`),
  KEY `fk_category` (`cat_id`),
  CONSTRAINT `fk_category` FOREIGN KEY (`cat_id`) REFERENCES `categories` (`cat_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES (4,'Lenovo V330','532262614-0','MP1HXLW5','Laptop',1,'Available','2026-01-16 05:12:08','item-1768722648341.jfif'),(5,'LINK PROFESSIONAL SET OF TOOL&TESTER','88592067265641','88592067265641','ที่เข้าหัวแลน1112',1,'Available','2026-01-16 07:10:48','item-1768722628800.jfif'),(6,'xxxx','11xxx',NULL,'xxx',2,'Available','2026-01-18 08:20:17','item-1768724528428.jpg');
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
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

-- Dump completed on 2026-01-18 15:49:42
