const express = require("express");
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://user:pass@cluster0.xyz.mongodb.net/cruddb";

mongoose.connect(MONGO_URI);

const Item = mongoose.model("Item", new mongoose.Schema({ name: String }));

const app = express();
app.use(express.json());

app.get("/items", async (req, res) => {
  res.json(await Item.find());
});

app.get("/items/:id", async (req, res) => {
  const item = await Item.findById(req.params.id);
  return item ? res.json(item) : res.status(404).json({ error: "Not found" });
});

app.post("/items", async (req, res) => {
  const item = await Item.create({ name: req.body.name });
  res.status(201).json(item);
});

app.put("/items/:id", async (req, res) => {
  const item = await Item.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
  return item ? res.json(item) : res.status(404).json({ error: "Not found" });
});

app.delete("/items/:id", async (req, res) => {
  const item = await Item.findByIdAndDelete(req.params.id);
  return item ? res.status(204).end() : res.status(404).json({ error: "Not found" });
});

app.listen(3000, () => console.log("Running on :3000"));
