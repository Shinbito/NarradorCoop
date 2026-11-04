-- Narrador Co-op: el diario de las misiones del Padre Nacho que salieron del rol
-- (Arcos/MisionesRiverside.lua: Eli Danner y el chico de los sacos). La despensa va en el cap. 2
-- (NarradorLoreCapitulos.lua). Sin tildes ni enies, primera persona.

require "Narrador/NarradorLore"

local Lore = Narrador.Lore

Lore.arcos.mision_eli = {
    intro = "El Diacono Reyes lo predico en el puente: en San Judas, en March Ridge, hay una oveja del patio anotada muerta que respira. Tres de la Sargento bajan a corregir la lista.",
    etapas = {
        viaje = "Voy a {lugar:san_judas}, la iglesia de Lucia, antes que los hombres del patio. El Padre dice que manana es tarde. No dijo a que hora; el tampoco promete horas.",
        san_judas = "San Judas tiene la puerta abierta de par en par y llena de recados clavados. Desde el coro alguien cuenta a los muertos de las bancas.",
        puerta = "Lucia me recibio en la puerta. Le dijo a Nacho que no mandara a nadie, y el me mando igual. Ella ya lo sabia. Lo dijo sin enojarse, como quien anota algo.",
        patio = "Subieron tres por la calle, gritando que venian a corregir la lista. Eli Danner se escondio en el coro. Lucia no cerro la puerta.",
        despues = "Los del patio ya no van a corregir nada. Lucia me prometio una estrofa entera sin equivocarse, que es lo que tiene. Eli tiene que elegir donde se queda.",
        volver = "Eli se queda en San Judas, cuidando la puerta. Vuelvo a contarle al Padre que el muchacho esta vivo. Lo demas, dice Lucia, se lo dice ella en la cara.",
        escolta = "Eli Danner va a Riverside, cojeando, con el balazo de noviembre en el muslo. Lucia se queda con un recado menos que cantar.",
        tarde = "Llegue a {lugar:san_judas} despues del dia y medio. Hay un papel clavado entre los recados de la puerta.",
    },
    finales = {
        final_cumplido_salvado = "Eli Danner esta vivo y se queda en San Judas con Lucia, aprendiendo a clavar recados. Le conte al Padre. Se quedo mirando la primera fila vacia un rato largo.",
        final_cumplido_riverside = "Traje a Eli Danner a Riverside. El Padre lo anoto en su lista sin signo de pregunta y le paso un balde. Aca se carga agua y no se pregunta de donde viene nadie.",
        final_muerto = "Eli Danner murio en San Judas. Lucia lo enterro al lado de los tomates del padre Ames y le canto las cuatro estrofas sin equivocarse.",
        final_tarde = "Llegue tarde a San Judas. Los del patio dejaron un papel en la puerta: 'Lista corregida'. Lucia enterro a Eli al lado de los tomates y me dijo que igual me esperaba, que es lo peor de esperar.",
        final_no_fue = "Nunca llegue a San Judas. Los del patio corrigieron la lista. Eli Danner esta enterrado en March Ridge.",
        final_abandonado = "No fui a San Judas. Los del patio corrigieron la lista. Eli Danner esta enterrado en March Ridge.",
    },
}

Lore.arcos.mision_tomas = {
    intro = "El Tom de los sacos: Tomas Ferrada, el hermano de Lucia. Cargaba sacos en la panaderia de Walt Hollis y los domingos se comia el pan duro en la escalera del Padre, sin entrar nunca. El 10 de julio no llego a trabajar.",
    etapas = {
        viaje = "Voy a {lugar:panaderia}, la de Walt Hollis. Ahi Tomas cargaba sacos y dormia en la bodega, encima de los sacos vacios.",
        panaderia = "La panaderia Hollis sigue como la dejo Yvonne el 10 de julio: cerrada con llave y con las bandejas de las seis quemadas. Busco el casillero de Tom.",
        viaje_terminal = "Tomas tomo el Greyhound de las 5:40 del sabado 10 de julio a Louisville, a buscar a su hermana a las hermanas de Santa Ines. Voy a {lugar:terminal}.",
        terminal = "En la pizarra de llegadas de {lugar:terminal} dice, con tiza y en castellano: 'Lucia Ferrada: tu hermano te espera aca.' Lleva cinco meses esperando que llegue un bus.",
        hablar = "Tomas esta vivo. Se hace llamar Tom. Pregunto por el patron Walt y por la senora Yvonne. Se fue a las 5:40; no alcanzo a saber nada.",
        escolta = "Tomas va a Riverside, a la iglesia donde nunca entro. Dice que primero quiere ver para creer.",
    },
    finales = {
        final_cumplido_vivo = { por_var = "lucia_viva", textos = {
            si = "Traje a Tomas Ferrada de Louisville. Lucia salio a la escalera de la iglesia, la misma donde el se comia el pan los domingos, y le dijo que tenia razon: ella tambien se fue un domingo. El Padre le borro el signo de pregunta de la lista.",
            otro = "Traje a Tomas Ferrada de Louisville. El Padre le borro el signo de pregunta de la lista y lo llevo atras, a la tumba de su hermana. Despues Tomas entro a la iglesia, por primera vez." } },
        final_tumba = "Tomas Ferrada murio antes de llegar a Riverside. Lo enterre donde cayo, con una tabla que dice Tom. El Padre le cambio el signo de pregunta por una cruz, con nombre.",
        final_sin_rastro = "Nunca llegue a la terminal del Greyhound. Tomas Ferrada sigue con signo de pregunta en la lista del Padre.",
        final_abandonado = "Deje de buscar a Tomas Ferrada. Sigue con signo de pregunta en la lista del Padre.",
    },
}

return Lore
