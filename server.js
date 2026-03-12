const express = require("express");
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/dhurandhar";

mongoose.connect(MONGO_URI);

const seatSchema = new mongoose.Schema({
  seat_id: String,
  available: Boolean,
  booked_by: String
});

const bookingSchema = new mongoose.Schema({
  booking_id: String,
  seat_id: String,
  user: String,
  status: String
});

const counterSchema = new mongoose.Schema({
  name: String,
  value: Number
});

const Seat = mongoose.model("Seat", seatSchema);
const Booking = mongoose.model("Booking", bookingSchema);
const Counter = mongoose.model("Counter", counterSchema);

async function initSeats() {
  const count = await Seat.countDocuments();
  if (count > 0) return;

  const seats = [];
  const rows = ["A", "B"];
  for (let r = 0; r < rows.length; r++) {
    for (let i = 1; i <= 20; i++) {
      seats.push({ seat_id: rows[r] + i, available: true, booked_by: null });
    }
  }
  await Seat.insertMany(seats);
  await Counter.create({ name: "booking", value: 100 });
}

function processPayment(payment) {
  if (payment.payment_mode === "UPI") {
    if (!payment.upi_id) return { success: false, reason: "upi_id is required" };
    return { success: true };
  }
  if (payment.payment_mode === "Credit Card") {
    if (!payment.card_number) return { success: false, reason: "card_number is required" };
    return { success: true };
  }
  if (payment.payment_mode === "Wallet") {
    if (!payment.wallet_id) return { success: false, reason: "wallet_id is required" };
    return { success: true };
  }
  return { success: false, reason: "Unknown payment mode" };
}

const app = express();
app.use(express.json());

app.get("/seats/:seatId", async function (req, res) {
  const seat = await Seat.findOne({ seat_id: req.params.seatId });

  if (!seat) {
    return res.status(404).json({ error: "Seat not found" });
  }

  res.json({ seat_id: seat.seat_id, available: seat.available });
});

app.post("/book", async function (req, res) {
  const user = req.body.user;
  const seatId = req.body.seat_id;
  const payment = req.body.payment;

  if (!user || !seatId || !payment) {
    return res.status(400).json({ error: "user, seat_id and payment are required" });
  }

  const seat = await Seat.findOne({ seat_id: seatId });

  if (!seat) {
    return res.status(404).json({ error: "Seat not found" });
  }

  if (!seat.available) {
    return res.status(400).json({ error: "Seat is already booked" });
  }

  const paymentResult = processPayment(payment);
  if (!paymentResult.success) {
    return res.status(400).json({ error: "Payment failed: " + paymentResult.reason });
  }

  seat.available = false;
  seat.booked_by = user;
  await seat.save();

  const counter = await Counter.findOneAndUpdate(
    { name: "booking" },
    { $inc: { value: 1 } },
    { new: true }
  );

  const bookingId = "B" + counter.value;

  await Booking.create({
    booking_id: bookingId,
    seat_id: seatId,
    user: user,
    status: "CONFIRMED"
  });

  res.status(201).json({
    booking_id: bookingId,
    seat_id: seatId,
    status: "CONFIRMED"
  });
});

mongoose.connection.once("open", async function () {
  await initSeats();
  app.listen(3000, function () {
    console.log("Running on :3000");
  });
});
