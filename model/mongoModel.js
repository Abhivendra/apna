const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const instance = mongoose.connect('mongodb://localhost:27017/apna', function (err, res) {
    console.log("connected to mongodb ");
});

const Schema = mongoose.Schema;

const usersSchema = Schema({
    name: String,
    email: String,
    phone: String,
    bio: String,
    image: String,
    hash: String,
    salt: String,
    isActive: Boolean,
    friends: [{ type: Schema.Types.ObjectId, ref: 'user'}]
}, {
    collection: 'user',
    timestamps: true,
    strict: false
});

// const friendsSchema = new Schema({
//     requester: { type: Schema.Types.ObjectId, ref: 'user'},
//     recipient: { type: Schema.Types.ObjectId, ref: 'user'},
//     status: {
//         type: Number,
//         enums: [
//             0,    //'add friend',
//             1,    //'requested',
//             2,    //'pending',
//             3,    //'friends'
//         ]
//     }
// }, {timestamps: true});

exports.UserModel = mongoose.model('user', usersSchema);
// exports.FriendModel = mongoose.model('friend', friendsSchema);
