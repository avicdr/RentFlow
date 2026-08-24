const mongoose = require('mongoose');
async function run() {
  await mongoose.connect('mongodb://localhost:27017/rentflow');
  const db = mongoose.connection;
  const properties = await db.collection('properties').find({ isDeleted: false }).toArray();
  let fixed = 0;
  for (const p of properties) {
    const rooms = await db.collection('rooms').find({ propertyId: p._id, isDeleted: false }).toArray();
    const totalRooms = rooms.length;
    const totalBeds = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
    const occupiedBeds = rooms.reduce((sum, r) => sum + (r.occupiedCount || 0), 0);
    if (p.totalRooms !== totalRooms || p.totalBeds !== totalBeds || p.occupiedBeds !== occupiedBeds) {
      await db.collection('properties').updateOne({ _id: p._id }, { $set: { totalRooms, totalBeds, occupiedBeds } });
      fixed++;
      console.log(`Fixed property ${p.name}: ${totalRooms} rooms, ${totalBeds} beds, ${occupiedBeds} occupied`);
    }
  }
  console.log(`Synced counters for ${fixed} properties.`);
  await mongoose.disconnect();
}
run().catch(console.error);
