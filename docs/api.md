\# 在线学习平台 API 使用说明



\## 基础信息



\- \*\*Base URL\*\*: `http://localhost:4000/api` (开发环境) 或 `https://api.icoursera.com/api` (生产环境)

\- \*\*响应格式\*\*: JSON

\- \*\*认证方式\*\*: Bearer Token (JWT)



\## 通用响应结构



```json

{

&#x20; "success": true,

&#x20; "message": "操作成功",

&#x20; "data": { ... }

}



错误码说明

状态码	说明

200	        请求成功

201    	创建成功

400	        请求参数错误

401	        未认证或 Token 失效

403	        无权限访问

404       	资源不存在

500	        服务器内部错误



认证流程

注册账号：POST /auth/register



登录获取 Token：POST /auth/login



携带 Token 访问：在请求头中添加 Authorization: Bearer <token>



核心 API 使用示例

