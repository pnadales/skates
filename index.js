
const express = require("express");
const app = express();
const exphbs = require("express-handlebars");
const expressFileUpload = require("express-fileupload");
const jwt = require("jsonwebtoken");
const secretKey = "Shicleto";
const fs = require('fs');

const { insertarSkater, consultarSkaters, editar, editarStatus, eliminar, consultaFoto } = require('./db')


let skaters = []


app.listen(3000, () => console.log("Servidor arriba en http://localhost:3000/"));


app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use(express.static(__dirname + "/public"));
app.use(
    expressFileUpload({
        limits: 5000000,
        abortOnLimit: true,
        responseOnLimit: "El tamaño de la imagen supera el límite permitido",
    })
);
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));
app.engine(
    "handlebars",
    exphbs({
        defaultLayout: "main",
        layoutsDir: `${__dirname}/views/mainLayout`,
    })
);
app.set("view engine", "handlebars");


// Rutas asociadas a los handlebars
app.get("/", async (req, res) => {
    try {
        skaters = await consultarSkaters()

        res.render("Home", { skaters });
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    };
});

app.get("/registro", (req, res) => {
    res.render("Registro");
});

app.get("/perfil", (req, res) => {
    const { token } = req.query
    jwt.verify(token, secretKey, (err, skater) => {
        if (err) {
            res.status(500).send({
                error: `Algo salió mal...`,
                message: err.message,
                code: 500
            })
        } else {
            res.render("Perfil", { skater });
        }
    })
});

app.get("/login", (req, res) => {
    res.render("Login");
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body

    try {
        skaters = await consultarSkaters()
        const skater = skaters.find((s) => s.email == email &&
            s.password == password);

        const token = jwt.sign(skater, secretKey)
        res.status(200).send(token)

    } catch (e) {

        console.log(e)
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })

    };
});

app.get("/Admin", async (req, res) => {
    try {
        skaters = await consultarSkaters()
        console.log(skaters)
        res.render("Admin", { skaters });
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    };
});


// API REST de Skaters

app.get("/skaters", async (req, res) => {

    try {
        res.status(200).send(skaters);
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    };
});

app.post("/skaters", async (req, res) => {
    const skater = req.body;
    if (Object.keys(req.files).length == 0) {
        return res.status(400).send("No se encontro ningun archivo en la consulta");
    }
    const { files } = req
    const { foto } = files;
    const { name } = foto;
    const pathPhoto = `/uploads/${name}`

    const datos = [skater.email, skater.nombre, skater.password, skater.anos_experiencia, skater.especialidad, pathPhoto, false]
    insertarSkater(datos)


    foto.mv(`${__dirname}/public${pathPhoto}`, async (err) => {
        try {
            if (err) throw err
            skater.foto = pathPhoto
            skaters.push(skater);
            res.status(201).redirect("/");
        } catch (e) {
            console.log(e)
            res.status(500).send({
                error: `Algo salió mal... ${e}`,
                code: 500
            })
        };

    });
})

app.put("/skaters", async (req, res) => {
    try {
        const { id, nombre, password, anos_experiencia, especialidad } = req.body;

        const datos = [id, nombre, password, anos_experiencia, especialidad]

        editar(datos)

    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    };
});

app.put("/skaters/status/:id", async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {

        editarStatus([id, estado])

        res.status(200).send("Estado Actualizado con éxito");


    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    };
});

app.delete("/skaters/:id", async (req, res) => {
    try {
        const { id } = req.params
        const foto = await consultaFoto(id)
        console.log(foto)
        const path = `./public${foto[0].foto}`
        eliminar(id)
        fs.unlink(path, (err) => {
            if (err) {
                console.error('Error al eliminar el archivo:', err);
                return;
            }
            console.log('Archivo eliminado exitosamente');
        });
        res.status(200).send("Skater Eliminado con éxito");
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    };
});

