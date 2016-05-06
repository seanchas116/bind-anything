"use strict";

const test = require("tape");
const bind = require("./index");

test("bind property", (t) => {
  const user = {};
  bind.add(user, "name", "Foo");
  bind.add(user, "id", "123");

  const dest = {};
  bind(dest, "name", user, ["name"]);
  bind(dest, "id", user, ["id"]);

  t.equal(dest.name, "Foo");
  t.equal(dest.id, "123");

  user.name = "Bar";
  user.id = "456";

  t.equal(dest.name, "Bar");
  t.equal(dest.id, "456");

  t.end();
});

test("bind property from nested path", (t) => {
  const user = {};
  bind.add(user, "name", "Foo");
  bind.add(user, "id", "123");

  const app = {};
  bind.add(app, "user", user);

  const user2 = {};
  bind.add(user2, "name", "Bar");
  bind.add(user2, "id", "456");

  const dest = {};

  bind(dest, "name", app, ["user", "name"]);
  bind(dest, "id", app, ["user", "id"]);
  t.equal(dest.name, "Foo");
  t.equal(dest.id, "123");

  app.user = user2;
  t.equal(dest.name, "Bar");
  t.equal(dest.id, "456");

  t.end();
});

test("bindings are exclusive", (t) => {
  const user = {};
  bind.add(user, "name", "Foo");
  bind.add(user, "id", "123");

  const user2 = {};
  bind.add(user2, "name", "Bar");
  bind.add(user2, "id", "456");

  const dest = {};
  bind(dest, "name", user, ["name"]);
  bind(dest, "id", user, ["id"]);
  t.equal(dest.name, "Foo");

  bind(dest, "name", user2, ["name"]);
  bind(dest, "id", user2, ["id"]);
  t.equal(dest.name, "Bar");

  user2.name = "Piyo";
  user2.id = "222";
  user.name = "Hoge";
  user.id = "111";
  t.equal(dest.name, "Piyo");
  t.equal(dest.id, "222");

  t.end();
});

test("dispose binding destination", (t) => {
  const user = {};
  bind.add(user, "name", "Foo");

  const dest = {};
  bind(dest, "name", user, ["name"]);
  t.equal(dest.name, "Foo");

  user.name = "Bar";
  t.equal(dest.name, "Bar");

  bind.dispose(dest);

  user.name = "Hoge";
  t.equal(dest.name, "Bar");

  t.end();
});
