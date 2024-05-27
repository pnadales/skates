const { Pool } = require("pg");
const { text } = require("stream/consumers");

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    password: "paulo",
    port: 5432,
    database: "skatepark"
})

const insertarSkater = async (datos) => {

    const consulta = {
        text: "INSERT INTO skaters (email, nombre, password, anos_experiencia, especialidad, foto, estado) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        values: datos
    };
    const result = await pool.query(consulta);
    return result
};

const consultarSkaters = async () => {
    const result = await pool.query("SELECT * FROM skaters");
    // console.log(result.rows);
    return result.rows;

}

const editar = async (datos) => {
    const consulta = {
        text: "UPDATE usuarios SET nombre=$2, balance=$3 WHERE id=$1 RETURNING *",
        values: datos
    }
    const result = await pool.query(consulta);
    return result;
}

const eliminar = async (id) => {
    const result = await pool.query("DELETE FROM usuarios WHERE id=$1 RETURNING *", [id]);

}


const consultaTrans = async (datos) => {
    const consulta = {
        text: "SELECT t.fecha, u.nombre AS emisor, r.nombre, t.monto FROM transferencias t INNER JOIN usuarios u ON u.id = t.emisor INNER JOIN usuarios r ON r.id = t.receptor",
        rowMode: 'array'
    }
    const result = await pool.query(consulta)

    return result.rows;
}



const insertarTrans = async (datos) => {
    // datos -> emisor, receptor, monto

    console.log("datos trans: ", datos);
    await pool.query("BEGIN");


    const descontar = {
        text: "UPDATE usuarios SET balance = balance - $2 WHERE id=$1",
        values: [datos[0], datos[2]]
    };
    await pool.query(descontar);

    const acreditar = {
        text: "UPDATE usuarios SET balance = balance + $2 WHERE id=$1",
        values: [datos[1], datos[2]]
    };
    await pool.query(acreditar);

    const insercion = {
        text: "INSERT INTO transferencias (emisor, receptor, monto, fecha) VALUES ($1, $2, $3, NOW()) RETURNING *",
        values: datos
    }
    const result = await pool.query(insercion)

    await pool.query("COMMIT");

    return result
}

module.exports = { insertarSkater, consultarSkaters, editar, eliminar, insertarTrans, consultaTrans };