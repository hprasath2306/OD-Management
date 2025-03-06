import express, { urlencoded } from "express";
import authRoutes from "./routes/auth/index.js";
import departmentRoutes from "./routes/department.js";
import designationRoutes from "./routes/designation.js";
import teacherRoutes from "./routes/teacher.js";

const app = express();
app.use(urlencoded({ extended: false }));
app.use(express.json());

const port = 3000;

//endpoints
app.use("/api/auth", authRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/designation", designationRoutes);
app.use("/api/teacher", teacherRoutes);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
