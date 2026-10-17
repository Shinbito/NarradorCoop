-- Narrador Co-op: etiquetas para el Director y consecuencias de cada final.
--   * tono (accion, drama, humor, misterio, vida), intensidad (1 a 5), peso_estacion y etiquetas
--     de cada historia: el Director las usa para elegir segun la tension y la estacion.
--   * huellas: que dice cada final de ti (salvaste, mataste, mentiste...). Mueven tu fama.
--   * ecos: consecuencias que llegan dias despues de ciertos finales.
-- Se aplican sobre los arcos ya registrados (no hace falta tocar sus archivos).
-- Sin tildes ni enies a proposito.

require "Narrador/NarradorDefs"
require "Narrador/Arcos/FamiliaInfectada"
require "Narrador/Arcos/EventosCortos"
require "Narrador/Arcos/Sous"
require "Narrador/Arcos/SousAmigos"

Narrador = Narrador or {}
local Et = Narrador.Etiquetas or {}
Narrador.Etiquetas = Et

Et.HISTORIAS = {
    familia_infectada = { tono = "drama", intensidad = 3, etiquetas = { "ayuda" } },
    horda_en_camino = { tono = "accion", intensidad = 4, peso_estacion = { otono = 1.5 } },
    alijo_custodiado = { tono = "accion", intensidad = 2 },
    sobreviviente_acorralada = { tono = "drama", intensidad = 3, etiquetas = { "ayuda" } },
    trueque_trampa = { tono = "accion", intensidad = 3, etiquetas = { "trampa" } },
    el_desertor = { tono = "drama", intensidad = 3, etiquetas = { "ayuda" } },
    hijo_perdido = { tono = "drama", intensidad = 3, etiquetas = { "ayuda" }, peso_estacion = { invierno = 1.3 } },
    asalto_nocturno = { tono = "accion", intensidad = 5, etiquetas = { "bandidos" } },
}

-- Huella que deja cada final: { acto, texto }. El texto acepta las plantillas del arco.
Et.HUELLAS = {
    familia_infectada = {
        final_salvados = { "salvaste", "Le consegui la cura a los Bell." },
        final_falso_remedio = { "salvaste", "Intente salvar a los Bell con un remedio que no era." },
        final_transformado = { "no_alcanzaste", "No alcance a salvar a uno de los Bell." },
        final_era_gripe = { "compartiste", "Les di techo a los Bell. Era solo una gripe." },
        final_se_curo_solo = { "compartiste", "Les di techo a los Bell hasta que se mejoraron." },
        final_abandonados = { "lo_dejaste", "Eche a los Bell de mi refugio." },
        final_masacre = { "mataste", "Mate a los Bell." },
        final_muertos = { "no_alcanzaste", "Los Bell murieron en mi refugio." },
        final_olvidados = { "lo_dejaste", "Me olvide de los Bell." },
    },
    sobreviviente_acorralada = {
        final_rescatada = { "salvaste", "Saque a Denise Hensley de su casa rodeada." },
        final_muerta = { "no_alcanzaste", "No alcance a salvar a Denise Hensley." },
        final_traicion = { "mataste", "Denise Hensley murio por mi mano." },
        final_tarde = { "lo_dejaste", "Nadie fue a ayudar a Denise Hensley. Yo tampoco." },
    },
    trueque_trampa = {
        final_ganada = { "peleaste", "Gane la emboscada del trueque." },
        final_escapaste = { "huiste", "Escape de la emboscada del trueque." },
    },
    el_desertor = {
        final_protegido = { "protegiste", "Escondi a Ray Doyle de la Guardia." },
        final_se_rindieron = { "protegiste", "Escondi a Ray Doyle hasta que la patrulla se aburrio." },
        final_capturado = { "no_alcanzaste", "La Guardia mato a Ray Doyle en mi refugio." },
        final_entregado = { "entregaste", "Entregue a Ray Doyle a la Guardia." },
        final_echado = { "lo_dejaste", "Eche a Ray Doyle." },
        final_lo_mataste = { "mataste", "Mate a Ray Doyle." },
    },
    hijo_perdido = {
        final_reunidos = { "salvaste", "Le devolvi a Lucas a su madre." },
        final_lo_encontraste_tarde = { "verdad", "Le lleve a Loretta Pike la mochila de su hijo." },
        final_lo_perdiste = { "no_alcanzaste", "Lucas Pike murio y yo estaba ahi." },
        final_tragedia = { "mataste", "Lucas Pike murio por mi mano." },
        final_tarde = { "lo_dejaste", "Nadie fue a buscar a Lucas Pike. Yo tampoco." },
    },
    asalto_nocturno = {
        final_rechazado = { "peleaste", "Defendi mi refugio de una banda armada." },
        final_se_retiraron = { "peleaste", "La banda que atacaba mi refugio se retiro." },
    },
    sous = {
        final_aliados = { "cumpliste", "Le devolvi a Sous todo lo que robo Meulen." },
        final_mentira = { "mentiste", "Le menti a Sous sobre lo que paso con Meulen." },
        final_te_quedaste = { "traicionaste", "Me quede con lo que Meulen le robo a Sous." },
        final_traicion = { "traicionaste", "Le dispare a Sous." },
        final_negado = { "lo_dejaste", "Le dije a Sous que no era mi problema." },
        final_maulen_escapa = { "no_alcanzaste", "Meulen se escapo." },
    },
}

-- Ecos: { def, final, horas = {min, max}, tipo, ... }
--   tipo "regalo": deja items cerca del jugador con una nota.
--   tipo "aviso": solo un aviso y una linea en el diario.
--   tipo "historia": abre otra historia (def_eco) con variables.
Et.ECOS = {
    { def = "sobreviviente_acorralada", final = "final_rescatada", horas = { 72, 160 }, tipo = "regalo",
      items = { { "Base.TinnedBeans", "Base.CannedBeans" }, { "Base.TinnedSoup", "Base.CannedSoup" }, { "Base.Bandage" } },
      nota = "Somos Denise y Lonnie. Te debemos todo. Esto es poco, pero es lo que juntamos. Cuidate.",
      texto = "Denise y Lonnie Hensley te dejaron un paquete con una nota." },
    { def = "sobreviviente_acorralada", final = "final_tarde", horas = { 48, 120 }, tipo = "aviso",
      texto = "Un viajero cuenta que vio a un muchacho llamado Lonnie llorando sentado en una vereda. No dijo por que." },
    { def = "el_desertor", final = "final_protegido", horas = { 72, 168 }, tipo = "regalo",
      items = { { "Base.Bullets9mmBox", "Base.Bullets9mm" }, { "Base.ShotgunShells" } },
      nota = "Me fui antes de que me encuentren. Te dejo lo que me sobraba. No olvido lo que hiciste. -Ray",
      texto = "Ray Doyle se fue de madrugada. Dejo municion y una nota." },
    { def = "el_desertor", final = "final_entregado", horas = { 48, 120 }, tipo = "aviso",
      texto = "Se corre el rumor de que fusilaron a un desertor en Louisville. Se llamaba Ray." },
    { def = "hijo_perdido", final = "final_reunidos", horas = { 96, 200 }, tipo = "regalo",
      items = { { "Base.Scarf_StripeBlackWhite", "Base.Scarf_White", "Base.Hat_WinterHat", "Base.Bandage" } },
      nota = "Te teji esto. Lucas eligio el color. Gracias por traerlo. -Loretta",
      texto = "Loretta Pike te dejo algo tejido a mano." },
    { def = "familia_infectada", final = "final_abandonados", horas = { 120, 240 }, tipo = "aviso",
      texto = "En una pared alguien escribio 'Los Bell estuvieron aqui'. Esta tachado." },
    { def = "trueque_trampa", final = "final_escapaste", horas = { 48, 120 }, tipo = "historia", def_eco = "asalto_nocturno",
      texto = "Los del trueque no se olvidaron de ti. Andan preguntando por tu refugio." },
}

local function copiar(lista)
    local r = {}
    for _, a in ipairs(lista) do r[#r + 1] = a end
    return r
end

-- Idempotente.
function Et.aplicar()
    local Defs = Narrador.Defs
    for id, e in pairs(Et.HISTORIAS) do
        local def = Defs.get(id)
        if def ~= nil then
            for k, v in pairs(e) do if def[k] == nil then def[k] = v end end
        end
    end
    for id, finales in pairs(Et.HUELLAS) do
        local def = Defs.get(id)
        if def ~= nil then
            for final, h in pairs(finales) do
                local etapa = def.etapas[final]
                if etapa ~= nil and not etapa._huella then
                    etapa._huella = true
                    etapa.al_entrar = copiar(etapa.al_entrar or {})
                    etapa.al_entrar[#etapa.al_entrar + 1] = { "huella", acto = h[1], texto = h[2] }
                end
            end
        end
    end
    for i, eco in ipairs(Et.ECOS) do
        local def = Defs.get(eco.def)
        local etapa = def ~= nil and def.etapas[eco.final] or nil
        if etapa ~= nil then
            etapa._ecos = etapa._ecos or {}
            if not etapa._ecos[i] then
                etapa._ecos[i] = true
                etapa.al_entrar = copiar(etapa.al_entrar or {})
                etapa.al_entrar[#etapa.al_entrar + 1] = { "eco", indice = i }
            end
        end
    end
end

Et.aplicar()
if Events ~= nil and not Et._enganchado then
    Et._enganchado = true
    if Events.OnGameStart ~= nil then Events.OnGameStart.Add(Et.aplicar) end
    if Events.OnServerStarted ~= nil then Events.OnServerStarted.Add(Et.aplicar) end
end

return Et
