
# 后端开发文档

## 一、负责模块
- 数据库表结构设计与初始化
- 用户注册/登录接口开发
- 课程列表/详情接口开发
- 习题作答与判分接口开发
- 错题本查询与管理接口开发

## 二、技术栈
- 开发工具：IntelliJ IDEA / VS Code
- 开发语言：Java
- 核心框架：Spring Boot
- ORM框架：MyBatis-Plus
- 数据库：MySQL 8.0

## 三、项目结构
backend/

├── src/

│ ├── main/

│ │ ├── java/

│ │ │ ├── controller/ # 接口控制层

│ │ │ ├── service/ # 业务逻辑层

│ │ │ ├── mapper/ # 数据访问层

│ │ │ ├── entity/ # 实体类

│ │ │ └── config/ # 配置类

│ │ └── resources/

│ │ ├── mapper/ # MyBatis 映射文件

│ │ └── application.yml # 项目配置文件

│ └── test/ # 单元测试

└── pom.xml # Maven 依赖配置


## 四、运行步骤
1. 配置本地MySQL数据库，创建项目所需数据库表
2. 修改 `application.yml` 中的数据库连接信息
3. 进入后端目录：`cd backend`
4. 安装依赖：`mvn clean install`
5. 启动项目：运行 `OnlineLearningPlatformApplication` 主类
6. 服务地址：`http://localhost:8080`
