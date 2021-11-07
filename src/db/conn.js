const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/logindb', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true});
//connection
const db = mongoose.connection;
db.on('error', console.error.bind(console,'connection error:'));
db.once('open', function() {
  // we're connected!
});

