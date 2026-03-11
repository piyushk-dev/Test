const express = require("express");
const fs = require("fs");
const path = require("path");

const DB = path.join(__dirname, "db.json");
const read = () => JSON.parse(fs.existsSync(DB) ? fs.readFileSync(DB, "utf8") : '{"items":[],"nextId":1}');
const write = (data) => fs.writeFileSync(DB, JSON.stringify(data, null, 2));

const app = express();
app.use(express.json());

app.get("/items", (req, res) => res.json(read().items));

app.get("/items/:id", (req, res) => {
  const item = read().items.find((i) => i.id === +req.params.id);
  return item ? res.json(item) : res.status(404).json({ error: "Not found" });
});

app.post("/items", (req, res) => {
  const db = read();
  const item = { id: db.nextId++, name: req.body.name };
  db.items.push(item);
  write(db);
  res.status(201).json(item);
});

app.put("/items/:id", (req, res) => {
  const db = read();
  const item = db.items.find((i) => i.id === +req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  item.name = req.body.name;
  write(db);
  res.json(item);
});

app.delete("/items/:id", (req, res) => {
  const db = read();
  const idx = db.items.findIndex((i) => i.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  db.items.splice(idx, 1);
  write(db);
  res.status(204).end();
});

app.listen(3000, () => console.log("Running on :3000"));
