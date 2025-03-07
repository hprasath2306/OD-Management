import express, { urlencoded } from "express";
import authRoutes from "./routes/auth/index.js";
import departmentRoutes from "./routes/department.js";
import designationRoutes from "./routes/designation.js";
import teacherRoutes from "./routes/teacher.js";
import cors from "cors";
import groupRoutes from "./routes/group.js";
import groupApproverRoutes from "./routes/groupApprover.js";
import studentRoutes from "./routes/student.js";
import teacherDesignationRoutes from "./routes/teacherDesignation";

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(urlencoded({ extended: false }));
app.use(express.json());

const port = 3000;

//endpoints
app.use("/api/auth", authRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/designation", designationRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/group", groupRoutes);
app.use("/api/group-approver", groupApproverRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/teacher-designations", teacherDesignationRoutes);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
