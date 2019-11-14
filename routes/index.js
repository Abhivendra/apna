const express = require('express');
const mongoose = require('mongoose');
const _ = require('lodash');
const router = express.Router();
const UserModel = require('../model/mongoModel').UserModel;

const SUGGESTION_LEVEL = 3;

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('Index', {title: 'Transaction Service'});
});

/* anity url for service watchers. */
router.get('/sanity', function (req, res, next) {
    res.send('UP');
    // res.send('UP', { title: 'Transaction Service' });
});

router.post('/createFriend', async function (req, res, next) {
    try {
        let body = req.body;
        if (!mongoose.Types.ObjectId.isValid(body.senderId) || !mongoose.Types.ObjectId.isValid(body.receiverId)) {
            res.status(500).send('invalid user id.');
            return;
        }
        let update1 = await UserModel.update({_id: body.senderId}, {$addToSet: {friends: body.receiverId}});
        console.log('update1', update1);
        let update2 = await UserModel.update({_id: body.receiverId}, {$addToSet: {friends: body.senderId}})
        console.log('update2', update2);

        res.status(200).send({
            success: true,
            friends: `${body.senderId} is added to ${body.receiverId}`
        });
    } catch (e) {
        console.error(e);
        res.status(500).send({message: 'Error in api!', error: e});
    }
});

router.get('/:userId/friends', async function (req, res, next) {
    try {
        let userId = req.params.userId;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            res.status(500).send('invalid user id.');
            return;
        }
        let friends = await UserModel.find({friends: userId}, {friends: 0, __v: 0});
        res.status(200).send({
            success: friends.length > 0,
            friends: friends
        });
    } catch (e) {
        res.status(500).send({message: 'Error in api!', error: e});
    }
});


router.get('/:userId/suggestedFriends', async function (req, res, next) {
    try {
        let userId = req.params.userId;

        let userDetail = await UserModel.findOne({_id: userId});

        //get friends of user
        let friends = await UserModel.find({friends: userId}, {friends: 1});


        let userFriends = userDetail.friends.map(val => val.toString());

        let allFriendOfFriend = friends.reduce((acc, friend) => {
            friend.friends = friend.friends.map(val => val.toString());
            acc = _.merge(acc, friend.friends);
            return acc;
        }, []);

        console.log('allFriendOfFriend', allFriendOfFriend);

        let suggestedFriends = allFriendOfFriend.filter(val => {
            return (userFriends.indexOf(val) === -1) && val !== userId;
        });

        //get fof
        let suggestedList = await UserModel.find({_id: {$in: suggestedFriends}}, {name: 1});

        res.status(200).send({
            success: suggestedList.length > 0,
            suggestedFriends: suggestedList
        });
        //get fofof
        //remove users which are already friends
    } catch (e) {
        console.log(e);
        res.status(500).send({message: 'Error in api!', error: e});
    }
});


router.post('/initialise', async function (req, res, next) {
    //create 1000 users
    let userArr = [];
    for (let i = 0; i < 1000; i++) {
        let user = {
            name: generateRandomName(10),
            email: `myemail${i}@email.com`,
            phone: generateRandomPhone(i),
            bio: '',
            image: '',
            hash: '',
            salt: '',
            isActive: true
        };
        userArr.push(user);
    }

    //pick 20 random users and add to friends
    let insertedUsers = await UserModel.create(userArr);

    let updateFriends = [];
    for (let i = 0; i < 50; i++) {
        let friends = [];
        let userPoolStart = i * 20;
        let userPoolEnd = i * 20 + 20;
        for (let j = userPoolStart; j < userPoolEnd; j++) {
            friends.push(insertedUsers[j]._id);
        }
        for (let j = userPoolStart; j < userPoolEnd; j++) {
            updateFriends.push({
                user: insertedUsers[j]._id,
                friends: friends.filter(val => {
                    return val.toString() !== insertedUsers[j]._id.toString()
                })
            });
        }
    }
    updateFriends.forEach(async val => {
        await UserModel.update({_id: val.user}, {$set: {friends: val.friends}});
    });


    res.status(200).send({
        success: true,
        message: 'user generated!',
        data: insertedUsers.map(val => val._id)
    });
});


function generateRandomPhone(i) {
    if (i.toString().length === 1) {
        i = `00${i}`
    } else if (i.toString().length === 2) {
        i = `0${i}`
    } else if (i.toString().length === 3) {
        i = `${i}`
    }
    return `9${Math.floor(100000 + Math.random() * 900000)}${i}`
}

function generateRandomName(length) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


module.exports = router;
