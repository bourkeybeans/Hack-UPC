from flask import Flask, render_template


app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/kieran")
def helloKieran():
    return "Hi kieran!"


if __name__ == "__main__":
    app.run()