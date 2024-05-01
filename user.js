class User {

  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  get userData() {
    return {
      id: this.id,
      name: this.name,
    }
  }
}

module.exports = User;
