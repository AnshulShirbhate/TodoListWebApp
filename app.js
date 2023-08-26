import express from "express";
import bodyParser from "body-parser";
import getDate from "./date.js";
import mongoose from "mongoose";

const app = express();

// This code here is making a connection to the Mongodb Atlas database which is hosted on the AWS server.
mongoose.connect("mongodb://localhost:27017/TodoList");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

const day = getDate();

// This schema is for the main daily todo items collection.
const itemsSchema = new mongoose.Schema({
  name: String
});


// This is the code for creating the collection with the schema of daily todo items.
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to Todo List!"
});

const item2 = new Item({
  name: "Click on the + button to add an item to the list"
});

const item3 = new Item({
  name: "<-- click on this checkbox to remove the item."
});

const defaultItems = [item1, item2, item3];


// This schema is for the dynamic collections which will be made by the users.
const customListSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const customListModel = new mongoose.model("customListItem", customListSchema);

app.get("/", async (req, res)=>{

  // First we check if the main todo list is empty. If it is empty then we insert the 
  // default items created above, else we render the already entered items.
  const listData = await Item.find();

  if(listData.length == 0){
    Item.insertMany(defaultItems);
    res.redirect("/");
  }else{
    res.render("list.ejs", {listTitle : day, listItems: listData});
  }
});



// This function is to create the dynamic urls for the different todo lists.
app.get("/:paramName", async function(req, res){
  const customListName = req.params.paramName;

  // This code is to convert the name of the list to capitalized form.
  const capitalized_list_name = customListName.charAt(0).toUpperCase() + customListName.slice(1).toLowerCase();
  
  const check = await customListModel.findOne({name: capitalized_list_name});

  // If the list is not present in the customListModel then we create a new one and if it is present
  // then we redirect to the function and if it exist then we render the existing one.
  if(!check){
    const CustomListItem = new customListModel({
      name: capitalized_list_name,
      items: defaultItems
    });
    CustomListItem.save();
    res.redirect("/"+capitalized_list_name); 
  }else{
    res.render("list.ejs", {listTitle : capitalized_list_name, listItems: check.items})
  }
  
});


app.post("/", async function(req, res){
  const item = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: item
  });

  if(listName == day){
    newItem.save();
    res.redirect("/");
  }else{
    const foundList = await customListModel.findOne({name: listName});
    foundList.items.push(newItem);
    foundList.save();
    res.redirect("/"+listName);
  }
});

app.post("/delete", async (req, res)=>{
  const listName = req.body.listName;
  const checked_item_id = req.body.checkbox;

  if(listName == day){
    await Item.deleteOne({_id: checked_item_id});
    res.redirect("/");
  }else{
    await customListModel.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checked_item_id}}});
    res.redirect("/"+listName);
  }
});


app.get("/about", function(req, res) {
  res.render("about");
});


app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
