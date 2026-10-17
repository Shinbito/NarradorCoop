# Graph Report - NarradorCoop  (2026-10-17)

## Corpus Check
- 71 files · ~238,517 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 916 nodes · 2852 edges · 31 communities (24 shown, 7 thin omitted)
- Extraction: 68% EXTRACTED · 32% INFERRED · 0% AMBIGUOUS · INFERRED: 923 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2ac71b4c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Mundo.horas
- NarradorGenerador.lua
- NarradorMotor.lua
- NarradorConversacion.lua
- NarradorMundo.lua
- NarradorDiario.lua
- NarradorContactos.lua
- NarradorKnox.lua
- NarradorConversas.lua
- NarradorDominios.lua
- NarradorCliente.lua
- Bandido.lua
- NarradorIndicadores.lua
- NarradorDefs.lua
- NarradorIndicadoresCalc.lua
- NarradorPasajeros.lua
- NarradorOcupaciones.lua
- NarradorLore.lua
- Ind.menu
- narrador_narradordefs
- NarradorLegendario.lua
- Generados.lua
- Inmorales.lua
- Contratos.lua
- Sous.lua
- NarradorObjetos.lua

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 94 edges
2. `Mundo.horas()` - 91 edges
3. `Mundo.azar()` - 64 edges
4. `Mundo.jugadores()` - 41 edges
5. `Mundo.log()` - 40 edges
6. `Motor.enviar()` - 38 edges
7. `Mundo.grupoDe()` - 36 edges
8. `Mundo.posicion()` - 34 edges
9. `Motor.iniciar()` - 33 edges
10. `C.estado()` - 32 edges

## Surprising Connections (you probably didn't know these)
- `S.comprar()` --calls--> `L.crearAuto()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorCampamentos.lua → 42/media/lua/shared/Narrador/NarradorLegendario.lua
- `S.alComando()` --calls--> `Mundo.log()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorConversacionServer.lua → 42/media/lua/server/Narrador/NarradorMundo.lua
- `CS.repasoCura()` --calls--> `Cura.infectado()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorCuraServer.lua → 42/media/lua/shared/Narrador/NarradorCura.lua
- `Motor.vistaObjetivo()` --calls--> `Mundo.horas()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorMotor.lua → 42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.pedirGrupo()` --calls--> `Mundo.existePerfil()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorMotor.lua → 42/media/lua/server/Narrador/NarradorMundo.lua

## Import Cycles
- None detected.

## Communities (31 total, 7 thin omitted)

### Community 0 - "Mundo.horas"
Cohesion: 0.05
Nodes (108): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+100 more)

### Community 1 - "NarradorGenerador.lua"
Cohesion: 0.09
Nodes (77): Cal.dulces(), Cal.ultimaNoche(), S.comprar(), S.forjar(), S.nivelConfianza(), S.recado(), C.darMapa(), C.decir() (+69 more)

### Community 2 - "NarradorMotor.lua"
Cohesion: 0.06
Nodes (86): C.revisarMall(), C.zonaSegura(), listasDe(), S.alComando(), S.completarArco(), S.elegirLinea(), S.frase(), S.hablar() (+78 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (68): Cliente.enviar(), ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir() (+60 more)

### Community 4 - "NarradorMundo.lua"
Cohesion: 0.06
Nodes (46): Cal.amigoSecreto(), Cal.calor(), Cal.corteLuz(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla(), Cal.residente(), Cal.sousAliados() (+38 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.08
Nodes (46): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+38 more)

### Community 6 - "NarradorContactos.lua"
Cohesion: 0.06
Nodes (70): avisarTodos(), banderasGuardia(), esCaja(), esMunicion(), esRopaSuelta(), mejorar(), porValor(), S.aparecer() (+62 more)

### Community 7 - "NarradorKnox.lua"
Cohesion: 0.09
Nodes (32): KC.despreciado(), KC.menu(), KC.menuCatalogo(), KC.miConfianza(), KC.textoReservas(), H.alTerminar(), H.anunciarTitulo(), H.completarHuella() (+24 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.12
Nodes (29): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+21 more)

### Community 9 - "NarradorDominios.lua"
Cohesion: 0.09
Nodes (27): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.st(), CS.vista(), C.alMorir(), C.revisarRegresos() (+19 more)

### Community 10 - "NarradorCliente.lua"
Cohesion: 0.09
Nodes (24): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.alIniciar(), Cliente.cuerpoDe(), Cliente.engancharMapa(), Cliente.esAdmin(), Cliente.menu(), Cliente.miEncargo() (+16 more)

### Community 12 - "NarradorIndicadores.lua"
Cohesion: 0.14
Nodes (15): Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.crear(), Ind.diagnostico(), Ind.hayViewpoint(), Ind.leer(), Ind.mirada() (+7 more)

### Community 14 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.22
Nodes (15): Ind.aPantalla(), Ind.textura(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+7 more)

### Community 15 - "NarradorPasajeros.lua"
Cohesion: 0.28
Nodes (14): C.curar(), Mundo.cuerpoActor(), alLado(), enAuto(), jugadorPorNombre(), P.bajar(), P.esAcompanante(), P.lista() (+6 more)

### Community 16 - "NarradorOcupaciones.lua"
Cohesion: 0.23
Nodes (18): casillaAfuera(), clave(), O.activo(), O.clasificar(), O.contar(), O.darBotin(), O.decorar(), O.deMisionero() (+10 more)

### Community 18 - "NarradorLore.lua"
Cohesion: 0.18
Nodes (6): Motor.loreTexto(), Motor.vistaLore(), Lore.de(), Lore.etapa(), Lore.final(), Lore.intro()

### Community 19 - "Ind.menu"
Cohesion: 0.21
Nodes (13): Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.avisarPreguntas(), Cliente.cartel(), Cliente.decir(), Cliente.halo(), Cliente.marcar(), Cliente.ponerMarcas() (+5 more)

### Community 20 - "narrador_narradordefs"
Cohesion: 0.13
Nodes (15): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+7 more)

### Community 21 - "NarradorLegendario.lua"
Cohesion: 0.33
Nodes (9): azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.crearAuto(), L.marcar() (+1 more)

### Community 22 - "Generados.lua"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 24 - "Inmorales.lua"
Cohesion: 0.43
Nodes (5): finales(), plazo(), registrarInmoral(), viaje(), volver()

### Community 25 - "Contratos.lua"
Cohesion: 0.73
Nodes (5): comunes(), encargoAlijo(), encargoBuscar(), encargoRescate(), salidasDePlazo()

### Community 26 - "Sous.lua"
Cohesion: 0.47
Nodes (3): esconditeComun(), etapasEscuadras(), perfilesDe()

### Community 27 - "NarradorObjetos.lua"
Cohesion: 0.38
Nodes (5): C.elegirEncargo(), Defs.todos(), anteponer(), O.ajustarArcos(), recorrerAcciones()

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Defs.get()` connect `NarradorMotor.lua` to `Mundo.horas`, `NarradorGenerador.lua`, `NarradorContactos.lua`, `NarradorKnox.lua`, `NarradorDefs.lua`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `Motor.estado()` connect `NarradorMotor.lua` to `Mundo.horas`, `NarradorGenerador.lua`, `NarradorMundo.lua`, `NarradorContactos.lua`, `NarradorKnox.lua`, `NarradorConversas.lua`, `NarradorDominios.lua`, `NarradorPasajeros.lua`, `NarradorOcupaciones.lua`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorGenerador.lua`, `NarradorMotor.lua`, `NarradorMundo.lua`, `NarradorContactos.lua`, `NarradorKnox.lua`, `NarradorConversas.lua`, `NarradorDominios.lua`, `NarradorOcupaciones.lua`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Are the 70 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `BA.jefe()`) actually correct?**
  _`Motor.estado()` has 70 INFERRED edges - model-reasoned connections that need verification._
- **Are the 89 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 89 INFERRED edges - model-reasoned connections that need verification._
- **Are the 53 inferred relationships involving `Mundo.azar()` (e.g. with `A.elegirTipo()` and `A.intervalo()`) actually correct?**
  _`Mundo.azar()` has 53 INFERRED edges - model-reasoned connections that need verification._
- **Are the 34 inferred relationships involving `Mundo.jugadores()` (e.g. with `A.tick()` and `jugadoresDe()`) actually correct?**
  _`Mundo.jugadores()` has 34 INFERRED edges - model-reasoned connections that need verification._