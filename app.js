const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public/"));

//mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');
mongoose.connect(process.env.MONGO_URL);

const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

const defaultItem1 = new Item({
  name: "Welcome to your To Do List!"
});

const defaultItem2 = new Item({
  name: "Hit the + button to add a new item."
});

const defaultItem3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [defaultItem1, defaultItem2, defaultItem3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find()
  .then((storedItems) => {
    if(storedItems.length === 0){
      Item.insertMany(defaultItems)
      .then(() => {
        console.log("Successfully saved default items to DB.");
      }).catch((err) => {
        console.log(err);
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: storedItems});
    }
  }).catch((err) => {
    console.log(err);
  });

});

app.post("/", function(req, res){

  const listName = req.body.list;
  const itemName = req.body.newItem;

  const newItem = new Item({
    name: itemName
  });

  if(listName === "Today"){
    newItem.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName})
    .then((foundList) => {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect(`/${listName}`);
    }).catch((err) => {
      console.log(err);
    });
  }

});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.deleteOne({_id: checkedItemId})
    .then(() => {
      res.redirect("/");
    }).catch((err) => {
      console.log(err);
    });
  }else{
    List.findOneAndUpdate(
      {name: listName},
      {$pull:{items : {_id:checkedItemId}}}
    ).then(() => {
      res.redirect(`/${listName}`);
    }).catch((err) => {
      console.log(err);
    });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName})
  .then((foundList) => {
    if(!foundList){
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect(`/${customListName}`);
    }else{
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
    }
  }).catch((err) => {
    console.log(err);
  });
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
