# Graph Report - NarradorCoop  (2026-10-16)

## Corpus Check
- 60 files · ~203,903 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 842 nodes · 2621 edges · 21 communities (20 shown, 1 thin omitted)
- Extraction: 69% EXTRACTED · 31% INFERRED · 0% AMBIGUOUS · INFERRED: 825 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e48f63c8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- NarradorMotor.lua
- Mundo.horas
- NarradorOcupaciones.lua
- NarradorConversacion.lua
- NarradorDefs.lua
- NarradorDiario.lua
- NarradorCliente.lua
- NarradorIndicadores.lua
- NarradorConversas.lua
- Mundo.jugadores
- NarradorCuraServer.lua
- NarradorKnox.lua
- NarradorPasajeros.lua
- NarradorMundo.lua
- NarradorLegendario.lua
- NarradorIndicadoresCalc.lua
- NarradorContactos.lua
- README.md
- NarradorContactos.lua
- Ideas futuras: campamentos de supervivientes
- envolver

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 85 edges
2. `Mundo.horas()` - 78 edges
3. `Mundo.azar()` - 58 edges
4. `Mundo.log()` - 37 edges
5. `Mundo.jugadores()` - 36 edges
6. `Motor.enviar()` - 33 edges
7. `Mundo.posicion()` - 32 edges
8. `Mundo.grupoDe()` - 32 edges
9. `Motor.iniciar()` - 31 edges
10. `C.estado()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `S.alComando()` --calls--> `Mundo.log()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorConversacionServer.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `KX.gruposDeFin()` --calls--> `H.gruposDe()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorKnox.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorHuellas.lua
- `Motor.vistaObjetivo()` --calls--> `Mundo.horas()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.pedirGrupo()` --calls--> `Mundo.existePerfil()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `KC.menuCatalogo()` --calls--> `K.precio()`  [INFERRED]
  NarradorCoop/42/media/lua/client/Narrador/NarradorCampamentosCliente.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorCampamentosDefs.lua

## Import Cycles
- None detected.

## Communities (21 total, 1 thin omitted)

### Community 0 - "NarradorMotor.lua"
Cohesion: 0.05
Nodes (88): S.aparecer(), C.aparecer(), C.encargosActivos(), C.revisarMall(), listasDe(), S.alComando(), S.completarArco(), S.elegirLinea() (+80 more)

### Community 1 - "Mundo.horas"
Cohesion: 0.10
Nodes (50): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+42 more)

### Community 2 - "NarradorOcupaciones.lua"
Cohesion: 0.24
Nodes (17): casillaAfuera(), clave(), O.activo(), O.clasificar(), O.contar(), O.darBotin(), O.decorar(), O.estadoTexto() (+9 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (67): ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir(), Conv.crearRastreador() (+59 more)

### Community 4 - "NarradorDefs.lua"
Cohesion: 0.06
Nodes (32): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+24 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.07
Nodes (51): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+43 more)

### Community 6 - "NarradorCliente.lua"
Cohesion: 0.10
Nodes (26): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.alIniciar(), Cliente.cartel(), Cliente.cuerpoDe(), Cliente.decir() (+18 more)

### Community 7 - "NarradorIndicadores.lua"
Cohesion: 0.12
Nodes (21): Cliente.avisarPreguntas(), Cliente.halo(), Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.cambiarModo(), Ind.crear(), Ind.diagnostico() (+13 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.12
Nodes (31): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+23 more)

### Community 9 - "Mundo.jugadores"
Cohesion: 0.10
Nodes (46): jugadoresDe(), Cal.brujasNoche(), C.darMapa(), C.jugadorEnPueblo(), Director.oir(), famas(), E.activo(), E.direccion() (+38 more)

### Community 10 - "NarradorCuraServer.lua"
Cohesion: 0.17
Nodes (14): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.repasoCura(), CS.st(), CS.vista(), Cura.curar() (+6 more)

### Community 11 - "NarradorKnox.lua"
Cohesion: 0.13
Nodes (22): KC.despreciado(), KC.menu(), KC.menuCatalogo(), KC.miConfianza(), C.tonoKnox(), anotar(), avisarGrupo(), KX.alMorirNpc() (+14 more)

### Community 12 - "NarradorPasajeros.lua"
Cohesion: 0.26
Nodes (15): C.curar(), Mundo.cuerpoActor(), alLado(), enAuto(), jugadorPorNombre(), P.agregar(), P.bajar(), P.esAcompanante() (+7 more)

### Community 13 - "NarradorMundo.lua"
Cohesion: 0.07
Nodes (42): C.cajaEdificio(), C.reponer(), Director.revisarVisitas(), contarTipos(), H.dispararEco(), calza(), casillaLibre(), centro() (+34 more)

### Community 14 - "NarradorLegendario.lua"
Cohesion: 0.38
Nodes (8): azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.marcar(), llamar()

### Community 16 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.20
Nodes (16): Ind.aPantalla(), Ind.objetivos(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+8 more)

### Community 18 - "NarradorContactos.lua"
Cohesion: 0.06
Nodes (73): anotar(), avisarTodos(), esCaja(), esMunicion(), esRopaSuelta(), mejorar(), porValor(), S.capituloExiste() (+65 more)

### Community 20 - "NarradorContactos.lua"
Cohesion: 0.08
Nodes (73): Cal.amigoSecreto(), Cal.calor(), Cal.corteLuz(), Cal.dulces(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla(), Cal.residente() (+65 more)

### Community 23 - "Ideas futuras: campamentos de supervivientes"
Cohesion: 0.08
Nodes (25): A. Eventos fortuitos de Eduardo (después de conocerlo), B. El camino del bandido (Knox negativo), Brújula sigue a la cámara (hecho, falta probar en el juego), C. Modo historia de los misioneros, Campamentos con niveles y comerciantes (hecho, falta probar), Diario en lápiz pasta azul (hecho, falta probar en el juego), Encuentros: llevar a la persona al campamento (hecho, falta probar), Estético (+17 more)

### Community 25 - "envolver"
Cohesion: 0.40
Nodes (5): envolver(), NarradorMensaje:mostrar(), NarradorTexto:limitarScroll(), NarradorTexto:onMouseWheel(), NarradorTexto:setBloques()

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor.estado()` connect `NarradorMotor.lua` to `Mundo.horas`, `NarradorOcupaciones.lua`, `NarradorConversas.lua`, `Mundo.jugadores`, `NarradorCuraServer.lua`, `NarradorKnox.lua`, `NarradorPasajeros.lua`, `NarradorMundo.lua`, `NarradorContactos.lua`, `NarradorContactos.lua`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Are the 61 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `Cal.corteLuz()`) actually correct?**
  _`Motor.estado()` has 61 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorMotor.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.05307709906199954 - nodes in this community are weakly interconnected._
- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorMotor.lua`, `NarradorOcupaciones.lua`, `NarradorConversas.lua`, `Mundo.jugadores`, `NarradorCuraServer.lua`, `NarradorKnox.lua`, `NarradorMundo.lua`, `NarradorContactos.lua`, `NarradorContactos.lua`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 76 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 76 INFERRED edges - model-reasoned connections that need verification._
- **Should `Mundo.horas` be split into smaller, more focused modules?**
  _Cohesion score 0.10304789550072568 - nodes in this community are weakly interconnected._
- **Why does `S.comprar()` connect `NarradorContactos.lua` to `Mundo.jugadores`, `NarradorKnox.lua`, `NarradorContactos.lua`, `NarradorMundo.lua`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._