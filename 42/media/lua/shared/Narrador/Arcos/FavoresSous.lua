-- Favores de Sous: cuando Sous queda aliado, cada integrante que siga vivo tiene un favor
-- personal. Se le pregunta en la base (clic derecho cerca de el): perdio algo en algun lado,
-- te da un mapa con la zona marcada y, si se lo devuelves, te regala su arma legendaria.
-- Zent y Matric perdieron el arma misma: cuando la encuentras, te dicen que te la quedes.
--
-- Dialogos originales, solo imitando la forma de hablar de cada uno. Sin tildes ni enies.

require "Narrador/NarradorDefs"
require "Narrador/Arcos/Sous"

Narrador = Narrador or {}
local F = Narrador.Favores or {}
Narrador.Favores = F

local ARMAS = {
    benjamin = "Narrador.MataPerrasMatric", martin_z = "Narrador.SarcasmoZent", martin_a = "Narrador.BarraAkagami",
    david = "Narrador.MarcoTeoricoShinbo", bastian = "Narrador.FachaTati", hanz = "Narrador.HachaWalita",
    cristian = "Narrador.PicotaCristonks", jorge = "Narrador.BalanceHasag", cristobal = "Narrador.PalaWertres",
}

local CASAS = { "livingroom", "kitchen", "bedroom" }

-- rol, nombre, objeto perdido (o el arma), donde, que tan peligroso, y lo que dice cada uno.
F.LISTA = {
    {
        rol = "benjamin", nombre = "Benjamin Matric", corto = "Matric", perdio_arma = true,
        objeto = ARMAS.benjamin, cosa = "la Mata Perras",
        salas = { "bar", "barstorage", "barkitchen", "nightclub" }, respaldo = CASAS, zombis = { 18, 26 },
        pedido = "Bro, hermano, te cuento algo pero no te riai. Fui a buscar copete a {lugar:perdido}, deje la katana apoyada en la barra y sali arrancando. La Mata Perras sigue ahi, bro. Me muero si se la lleva otro.",
        mapa = "Mapa de Matric",
        marca = "Aca quedo la Mata Perras (la barra)",
        pista = "Recuperar la katana de Matric en {lugar:perdido}.",
        gracias = "Broo, la encontraste! Sabes que? Quedatela, hermano. Te la ganaste. Yo apano con otra cosa, dale.",
        diario = "Matric te dejo quedarte con La Mata Perras. Dice que es tuya de por vida.",
    },
    {
        rol = "martin_z", nombre = "Martin Zent", corto = "Zent", perdio_arma = true,
        objeto = ARMAS.martin_z, cosa = "su cuchillo",
        salas = { "gasstore", "grocery", "conveniencestore", "grocerystorage" }, respaldo = CASAS, zombis = { 12, 18 },
        pedido = "Perdi mi cuchillo en {lugar:perdido}. No es que lo extrane. Es por principio. Si vas, vas. Si no, tambien.",
        mapa = "Mapa de Zent",
        marca = "Cuchillo. No te demores.",
        pista = "Encontrar el cuchillo de Zent en {lugar:perdido}.",
        gracias = "Mi cuchillo. Mira tu. Quedatelo. Si me lo devuelves voy a tener que agradecerte, y eso no me sale.",
        diario = "Zent no te dio las gracias, pero te dejo quedarte con El Comentario Sarcastico.",
    },
    {
        rol = "martin_a", nombre = "Martin Akagami", corto = "Akagami",
        objeto = "Narrador.PelotaAkagami", cosa = "la pelota firmada",
        salas = { "classroom", "gym", "lockerroom", "sportstore" }, respaldo = CASAS, zombis = { 14, 20 },
        pedido = "Mi bro, tres cosas. Uno: la pelota de la ultima pichanga quedo en {lugar:perdido}. Dos: esta firmada. Tres: la quiero de vuelta, cabros o no cabros.",
        mapa = "Mapa de Akagami",
        marca = "1. Pelota  2. Volver  3. Vivo",
        pista = "Traerle a Akagami su pelota desde {lugar:perdido}.",
        gracias = "Mi sangre, te debo una. Toma la Barra de Dominadas. Primero: cuidala. Segundo: usala. Tercero: no me la devuelvas nunca.",
        diario = "Akagami te regalo La Barra de Dominadas por devolverle la pelota.",
    },
    {
        rol = "david", nombre = "David Shinbo", corto = "Shinbo",
        objeto = "Narrador.FotoSous", cosa = "la foto de Sous",
        salas = { "livingroom", "bedroom" }, respaldo = { "kitchen", "office" }, zombis = { 10, 16 },
        pedido = "Hola. Esto me cuesta pedirlo. En {lugar:perdido} deje una foto de todos nosotros, de antes. Me gustaria tenerla. Si puedes.",
        mapa = "Mapa de Shinbo",
        marca = "La foto (repisa)",
        pista = "Buscar la foto de Sous que Shinbo dejo en {lugar:perdido}.",
        gracias = "Gracias. De verdad. Toma, el Marco Teorico. Pesa harto, como toda buena teoria.",
        diario = "Shinbo te regalo El Marco Teorico por la foto de Sous.",
    },
    {
        rol = "bastian", nombre = "Bastian Tati", corto = "Tati",
        objeto = "Narrador.CollarTati", cosa = "el collar de plata",
        salas = { "clothesstore", "shoestore", "jewelrystore", "clothesstorestorage" }, respaldo = CASAS, zombis = { 16, 24 },
        pedido = "Oe loco, perdi mi collar de plata en {lugar:perdido}. Fui a buscar ropa po, no me mires asi. Sin el collar no soy yo.",
        mapa = "Mapa de Tati",
        marca = "Collar (probadores)",
        pista = "Recuperar el collar de Tati en {lugar:perdido}.",
        gracias = "Eres un crack, loco. Toma la Facha, mi machete. Con facha se pelea mejor po.",
        diario = "Tati te regalo La Facha por devolverle el collar.",
    },
    {
        rol = "hanz", nombre = "Hanz Walita", corto = "Walita",
        objeto = "Narrador.TalladoWalita", cosa = "el tallado",
        salas = { "garagestorage", "warehouse", "carpentry", "toolstore" }, respaldo = CASAS, zombis = { 14, 20 },
        pedido = "Vale broder, se me quedo un tallado en {lugar:perdido}. Una llamita. La hice con estas manos y no la voy a dejar botada.",
        mapa = "Mapa de Walita",
        marca = "La llamita, vale",
        pista = "Traerle a Walita su tallado desde {lugar:perdido}.",
        gracias = "Vale broder, gracias. Te regalo mi hacha. El mango se lo talle yo, asi que cuidala.",
        diario = "Walita te regalo El Hacha Tallada por devolverle la llamita.",
    },
    {
        rol = "cristian", nombre = "Cristian Cristonks", corto = "Cristonks",
        objeto = "Narrador.AntiparrasCristonks", cosa = "las antiparras",
        salas = { "sportstore", "sportstorage", "campingstore", "campingstorage" }, respaldo = CASAS, zombis = { 14, 22 },
        pedido = "Compadre! Perdi mis antiparras de nieve en {lugar:perdido}. Sin ellas no subo ni al segundo piso. Akkakaka. Me las traes?",
        mapa = "Mapa de Cristonks",
        marca = "Antiparras! akkaka",
        pista = "Recuperar las antiparras de Cristonks en {lugar:perdido}.",
        gracias = "Compadreee! Akkakaka. Toma mi picota, sirve pa los cerros y pa los muertos.",
        diario = "Cristonks te regalo La Picota del Cerro por las antiparras.",
    },
    {
        rol = "jorge", nombre = "Jorge Hasag", corto = "Hasag",
        objeto = "Narrador.LibroCuentasHasag", cosa = "el libro de cuentas",
        salas = { "office", "bank", "officestorage" }, respaldo = CASAS, zombis = { 14, 20 }, bandidos = { 1, 2 },
        pedido = "Manito, deje el libro de cuentas en {lugar:perdido}. Sin el no cuadra nada, broder. Ni las latas, ni las balas, ni lo que me debes.",
        mapa = "Mapa de Hasag",
        marca = "Libro de cuentas (escritorio)",
        pista = "Recuperar el libro de cuentas de Hasag en {lugar:perdido}.",
        gracias = "Ahora si cuadra todo, manito. Toma el Balance General, mi bate. Inversion pura, sangre.",
        diario = "Hasag te regalo El Balance General por devolverle el libro de cuentas.",
    },
    {
        rol = "cristobal", nombre = "Cristobal Wertres", corto = "Wertres",
        objeto = "Narrador.CamisetaBicho", cosa = "la camiseta del Bicho",
        salas = { "laundry", "clothesstore", "bedroom" }, respaldo = CASAS, zombis = { 12, 18 },
        pedido = "Hermanito, se me quedo la camiseta del Bicho en {lugar:perdido}. La numero 7, wn. Es sagrada, sangre.",
        mapa = "Mapa de Wertres",
        marca = "Camiseta 7 (siuuu)",
        pista = "Traerle a Wertres su camiseta desde {lugar:perdido}.",
        gracias = "Siuuu! Gracias hermanito. Toma mi pala, es larga como yo, wn.",
        diario = "Wertres te regalo La Pala del Bicho por devolverle la camiseta.",
    },
}

function F.def(rol)
    for _, f in ipairs(F.LISTA) do if f.rol == rol then return f end end
    return nil
end

function F.idDe(rol) return "favor_" .. rol end

-- Este integrante sigue vivo como residente de Sous? Devuelve uid o nil. (Solo servidor.)
function F.residente(rol)
    local Motor = Narrador.Motor
    if Motor == nil then return nil end
    local r = Motor.estado().residentes.sous
    if r == nil then return nil end
    for uid, m in pairs(r.miembros or {}) do
        if m.rol == rol and not m.muerto then return uid, m end
    end
    return nil
end

-- Se puede pedir ahora: Sous aliado, el vivo, favor no hecho y no hay otro igual en curso.
function F.disponible(rol)
    local Motor = Narrador.Motor
    if Motor == nil then return false end
    local st = Motor.estado()
    if st.memoria.sous ~= "aliados" then return false end
    if st.memoria["favor_" .. rol] == "hecho" then return false end
    if Motor.activos(F.idDe(rol)) > 0 then return false end
    return F.residente(rol) ~= nil
end

local function registrarFavor(f)
    local rol = f.rol
    local enSitio = {
        { "oleada", lugar = "perdido", radio = 50, cantidad = f.zombis },
        { "objeto", id = "cosa", lugar = "perdido", radio = 50, tipo = { f.objeto } },
    }
    if f.bandidos ~= nil then
        enSitio[#enSitio + 1] = { "bandidos", id = "bandidos", lugar = "perdido", radio = 60, modo = "guard", cantidad = f.bandidos }
    end
    local final = {
        { "memoria", clave = "favor_" .. rol, valor = "hecho" },
        { "diario", texto = f.diario },
    }
    if not f.perdio_arma then
        table.insert(final, 1, { "recompensa", lugar = "base", radio = 40, items = { { ARMAS[rol] } } })
    end
    Narrador.Defs.registrar({
        id = F.idDe(rol),
        titulo = "Favor de " .. f.corto,
        titulo_menu = "Favor de Sous: " .. f.nombre,
        requiere_alife = true,
        automatico = false,
        inicio = "pedido",
        favor_rol = rol,
        etapas = {
            pedido = {
                al_entrar = {
                    { "prestar_residente", residente = "sous", rol = rol, grupo = "pide" },
                    { "lugar_memoria", id = "base", clave = "base_sous", salas = { "farmstorage", "barn", "warehouse" },
                      respaldo = CASAS },
                    { "lugar", id = "perdido", desde = "base", salas = f.salas, respaldo = f.respaldo, min = 150, max = 900 },
                    { "decir", grupo = "pide", rol = rol, texto = f.pedido },
                    { "mapa_con_marcas", lugar = "perdido", titulo = f.mapa, texto = f.marca,
                      marcas = { { lugar = "base", simbolo = "NarradorSous", texto = "Base de Sous", r = 0.75, g = 0.12, b = 0.05 } } },
                    { "diario", texto = f.nombre .. " perdio " .. f.cosa .. " en {lugar:perdido}. Te dejo un mapa dibujado a mano." },
                },
                salidas = { { ir = "buscar" } },
            },
            buscar = {
                pista = f.pista,
                al_entrar = enSitio,
                salidas = {
                    { cuando = { "alguien_tiene", "cosa" }, ir = "volver" },
                    { cuando = { "muerto", "pide", rol }, ir = "final_murio" },
                },
            },
            volver = {
                pista = "Llevarle " .. f.cosa .. " a " .. f.corto .. " en la base de Sous.",
                ancla = "base",
                ancla_grupo = "pide",
                opciones = {
                    { id = "entregar", texto = f.perdio_arma and ("Mostrarle a " .. f.corto .. " que encontraste " .. f.cosa)
                                                   or ("Devolverle " .. f.cosa .. " a " .. f.corto),
                      requiere = { "objeto", "cosa" }, consume = not f.perdio_arma, falta = "No lo llevas encima.",
                      dice = { rol = rol, texto = f.gracias } },
                },
                salidas = {
                    { cuando = { "eleccion", "entregar" }, ir = "final_hecho" },
                    { cuando = { "muerto", "pide", rol }, ir = "final_murio" },
                },
            },
            final_hecho = { final = true, al_entrar = final },
            final_murio = {
                final = true,
                al_entrar = {
                    { "memoria", clave = "favor_" .. rol, valor = "murio" },
                    { "diario", texto = f.nombre .. " no alcanzo a recuperar " .. f.cosa .. "." },
                },
            },
        },
    })
end

for _, f in ipairs(F.LISTA) do registrarFavor(f) end

-- Pistas en la charla de la base: avisan que tienen algo que pedir.
Narrador.Charlas = Narrador.Charlas or {}
Narrador.Charlas.sous_aliados = Narrador.Charlas.sous_aliados or {}
F.PISTAS = {
    { "benjamin", "Bro, tengo un problema con mi katana. Despues te cuento. Bueno, ahora, si quieres." },
    { "martin_z", "Me falta algo. No voy a pedir ayuda. Pero si preguntas, te cuento." },
    { "martin_a", "Mi bro, cuando tengas un rato hablamos. Tengo una lista. Es corta." },
    { "david", "Tengo algo que pedirte... cuando puedas. No es urgente. Bueno, un poco." },
    { "bastian", "Oe, ven pa aca cuando puedas. Te tengo una mision con estilo, loco." },
    { "hanz", "Broder, se me quedo algo afuera. Despues te cuento, vale." },
    { "cristian", "Compadre! Te tengo una pega. Akkakaka. Preguntame." },
    { "jorge", "Manito, hay algo que no me cuadra y necesito tu ayuda pa cuadrarlo." },
    { "cristobal", "Hermanito, necesito un favor grande. Como yo, wn." },
}
if not F._pistas then
    F._pistas = true
    for _, p in ipairs(F.PISTAS) do
        local rol = p[1]
        local lista = Narrador.Charlas.sous_aliados
        lista[#lista + 1] = { rol, p[2], si = function() return F.disponible(rol) end }
    end
end

return F
