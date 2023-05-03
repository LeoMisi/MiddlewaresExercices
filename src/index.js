const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());
app.use(cors());

const users = [];

function checksExistsUserAccount(request, response, next) {
    const { username } = request.headers;

    const usersAreExists = users.find((user) => user.username === username);

    if (usersAreExists) {
        request.username = username;
        next();
    } else {
        return response.status(404).json({ error: "User already exists" });
    }
}

function checksCreateTodosUserAvailability(request, response, next) {
  const { username } = request;

  const user = users.find((user) => user.username === username);

  if ((user.pro === false && user.todos.length < 10) || user.pro === true) {
    return next();
  }

  return response
    .status(400)
    .json({ error: "Error to search some information" });
}

function checksTodoExists(request, response, next) {
  const { username } = request.headers;
  const { id } = request.params;

  const usersAreExists = users.find((user) => user.username === username);
  const todoByUser = usersAreExists.todos.find((todo) => todo.id === id);

  if (!todoByUser) {
    return response.status(404).json({ error: "ToDo doesn't exists" });
  }

  request.usename = username;
  request.todo = todoByUser;

  return next();
}

function findUserById(request, response, next) {
  const { id } = request.params;

  const usersAreExists = users.find((user) => user.id === id);

  if (usersAreExists) {
    request.user = usersAreExists;
    next();
  } else {
    return response.status(404).json({ error: "User doesn't exists" });
  }
}


app.post("/users", (request, response) => {
  const { name, username} = request.body;

  const usernameAlreadyExists = users.some(
    (user) => user.username === username
  );

  if (usernameAlreadyExists) {
    return response.status(400).json({ error: "Username already exists" });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    pro: false,
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});


app.get("/users/:id", findUserById, (request, response) => {
  const { user } = request;

  return response.json(user);
});


app.patch("/users/:id/pro", findUserById, (request, response) => {
  const { user } = request;

  if (user.pro) {
    return response
      .status(400)
      .json({ error: "Pro plan is already activated." });
  }

  user.pro = true;

  return response.json(user);
});


app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { username } = request;

  const userFound = users.find((user) => user.username === username);

  return response.json(userFound.todos);
});


app.post(
    "/todos",
    checksExistsUserAccount,
    checksCreateTodosUserAvailability,
    (request, response) => {
        const { title, deadline } = request.body;
        const { username } = request;

    const newTodo = {
        id: uuidv4(),
        title,
        deadline: new Date(deadline),
        done: false,
        created_at: new Date(),
    };

    const userToPush = users.find((user) => user.username === username);

    userToPush.todos.push(newTodo);

    return response.status(201).json(newTodo);
  }
);

app.put("/todos/:id", checksTodoExists, (request, response) => {
  const { title, deadline } = request.body;
  const { todo } = request;

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.json(todo);
});


app.patch("/todos/:id/done", checksTodoExists, (request, response) => {
  const { todo } = request;

  todo.done = true;

  return response.json(todo);
});

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checksTodoExists,
  (request, response) => {
    const { username, todo } = request;

    const userToDelete = users.find((user) => user.username === username);

    const todoIndex = userToDelete.todos.indexOf(todo);

    if (todoIndex === -1) {
      return response.status(404).json({ error: "Todo not found" });
    }

    userToDelete.todos.splice(todoIndex, 1);

    return response.status(204).send();
  }
);

module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById,
};
