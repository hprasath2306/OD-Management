import express, { urlencoded } from "express";
import authRoutes from "./routes/auth/index.js";
import departmentRoutes from "./routes/department.js";
import designationRoutes from "./routes/designation.js";
import teacherRoutes from "./routes/teacher.js";
import cors from "cors";
import groupRoutes from "./routes/group.js";
import groupApproverRoutes from "./routes/groupApprover.js";
import studentRoutes from "./routes/student.js";
import teacherDesignationRoutes from "./routes/teacherDesignation.js";
import labRoutes from "./routes/lab.js";
import flowTemplateRoutes from "./routes/flowTemplate.js";
import flowStepRoutes from "./routes/flowStep.js";
import requestRoutes from "./routes/request.js";
import uploadRoutes from "./routes/upload.js";

const app = express();
// app.use(
//   cors({
//     origin: ["http://localhost:5173", "https://clovers-acadify.vercel.app", "https://odadmin.vercel.app"],
//     credentials: true,
//   })
// );

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
}));
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
app.use("/api/lab", labRoutes);
app.use("/api/flow-templates", flowTemplateRoutes);
app.use("/api/flow-steps", flowStepRoutes);
app.use("/api/requests", requestRoutes);

app.use("/api/upload", uploadRoutes);

app.get("/", (req, res) => {
  res.send("Server is runnig");
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
