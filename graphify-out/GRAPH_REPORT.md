# Graph Report - NarradorCoop  (2026-10-16)

## Corpus Check
- 60 files · ~204,864 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 845 nodes · 2634 edges · 29 communities (27 shown, 2 thin omitted)
- Extraction: 69% EXTRACTED · 31% INFERRED · 0% AMBIGUOUS · INFERRED: 829 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `59f2a7d0`
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
- NarradorEncuentros.lua
- NarradorCuraServer.lua
- NarradorKnox.lua
- NarradorContactos.lua
- NarradorMundo.lua
- Mundo.sandbox
- Mundo.azar
- NarradorIndicadoresCalc.lua
- NarradorMapas.lua
- NarradorCampamentos.lua
- README.md
- NarradorContactos.lua
- Generados.lua
- S.pedirFavor
- Ideas futuras: campamentos de supervivientes
- NarradorObjetosServer.lua
- envolver
- NarradorObjetos.lua
- Contratos.lua
- Sous.lua

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
10. `C.estado()` - 30 edges

## Surprising Connections (you probably didn't know these)
- `C.tonoKnox()` --calls--> `KD.tono()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorContactos.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorKnoxDefs.lua
- `KX.gruposDeFin()` --calls--> `H.gruposDe()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorKnox.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorHuellas.lua
- `Motor.transformar()` --calls--> `Mundo.zombiEn()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.pedirGrupo()` --calls--> `Mundo.existePerfil()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.elegir()` --calls--> `Mundo.tieneEtiqueta()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua

## Import Cycles
- None detected.

## Communities (29 total, 2 thin omitted)

### Community 0 - "NarradorMotor.lua"
Cohesion: 0.06
Nodes (100): C.aparecer(), C.encargosActivos(), C.limpiar(), C.revisarDesbloqueo(), C.revisarMall(), C.revisarRegresos(), C.zonaSegura(), listasDe() (+92 more)

### Community 1 - "Mundo.horas"
Cohesion: 0.12
Nodes (41): Director.abrirPendientes(), Director.alIniciar(), Director.anotar(), Director.bajarTension(), Director.candidatos(), Director.estadoTexto(), Director.estilo(), Director.lanzar() (+33 more)

### Community 2 - "NarradorOcupaciones.lua"
Cohesion: 0.23
Nodes (18): casillaAfuera(), clave(), O.activo(), O.clasificar(), O.contar(), O.darBotin(), O.decorar(), O.deMisionero() (+10 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (67): ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir(), Conv.crearRastreador() (+59 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.07
Nodes (50): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+42 more)

### Community 6 - "NarradorCliente.lua"
Cohesion: 0.10
Nodes (26): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.alIniciar(), Cliente.cartel(), Cliente.cuerpoDe(), Cliente.decir() (+18 more)

### Community 7 - "NarradorIndicadores.lua"
Cohesion: 0.12
Nodes (21): Cliente.avisarPreguntas(), Cliente.halo(), Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.cambiarModo(), Ind.crear(), Ind.diagnostico() (+13 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.12
Nodes (30): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+22 more)

### Community 9 - "NarradorEncuentros.lua"
Cohesion: 0.28
Nodes (11): E.activo(), E.direccion(), E.elegirTipo(), E.estado(), E.lanzar(), E.misioneroCercano(), E.nivelSandbox(), E.revisarJugador() (+3 more)

### Community 10 - "NarradorCuraServer.lua"
Cohesion: 0.17
Nodes (14): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.repasoCura(), CS.st(), CS.vista(), Cura.curar() (+6 more)

### Community 11 - "NarradorKnox.lua"
Cohesion: 0.19
Nodes (15): anotar(), KX.alMorirNpc(), KX.bandidosLimpios(), KX.despreciado(), KX.esHostil(), KX.gruposDeFin(), KX.nivelDe(), KX.npcEnHistoria() (+7 more)

### Community 12 - "NarradorContactos.lua"
Cohesion: 0.10
Nodes (35): C.alMorir(), C.anotarPuertas(), C.cajaEdificio(), C.cuerpoMuerto(), C.curar(), C.curarPuertas(), C.encargoActivo(), C.enterrar() (+27 more)

### Community 13 - "NarradorMundo.lua"
Cohesion: 0.07
Nodes (32): contarTipos(), casillaLibre(), mismasBanderas(), Mundo.acompanar(), Mundo.arreglarCarnet(), Mundo.banderas(), Mundo.buscarItem(), Mundo.buscarItems() (+24 more)

### Community 14 - "Mundo.sandbox"
Cohesion: 0.22
Nodes (19): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+11 more)

### Community 15 - "Mundo.azar"
Cohesion: 0.29
Nodes (13): C.jugadorEnPueblo(), Motor.zonaDe(), calza(), centro(), elegirSala(), Mundo.azar(), Mundo.buscarCercaDe(), Mundo.buscarEnPueblo() (+5 more)

### Community 16 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.20
Nodes (16): Ind.aPantalla(), Ind.objetivos(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+8 more)

### Community 17 - "NarradorMapas.lua"
Cohesion: 0.26
Nodes (9): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+1 more)

### Community 18 - "NarradorCampamentos.lua"
Cohesion: 0.09
Nodes (40): KC.despreciado(), KC.menu(), KC.menuCatalogo(), KC.miConfianza(), anotar(), avisarTodos(), esCaja(), esMunicion() (+32 more)

### Community 20 - "NarradorContactos.lua"
Cohesion: 0.06
Nodes (101): Cal.amigoSecreto(), Cal.brujasNoche(), Cal.calor(), Cal.corteLuz(), Cal.dulces(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla() (+93 more)

### Community 21 - "Generados.lua"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 22 - "S.pedirFavor"
Cohesion: 0.42
Nodes (8): S.alComando(), S.favoresDisponibles(), S.pedirFavor(), F.def(), F.disponible(), F.idDe(), F.residente(), registrarFavor()

### Community 23 - "Ideas futuras: campamentos de supervivientes"
Cohesion: 0.08
Nodes (25): A. Eventos fortuitos de Eduardo (después de conocerlo), B. El camino del bandido (Knox negativo), Brújula sigue a la cámara (hecho, falta probar en el juego), C. Modo historia de los misioneros, Campamentos con niveles y comerciantes (hecho, falta probar), Diario en lápiz pasta azul (hecho, falta probar en el juego), Encuentros: llevar a la persona al campamento (hecho, falta probar), Estético (+17 more)

### Community 24 - "NarradorObjetosServer.lua"
Cohesion: 0.43
Nodes (5): Mundo.crearMapa(), Mundo.crearMapaZona(), S.casillaConPared(), S.crearMapa(), S.zona()

### Community 25 - "envolver"
Cohesion: 0.40
Nodes (5): envolver(), NarradorMensaje:mostrar(), NarradorTexto:limitarScroll(), NarradorTexto:onMouseWheel(), NarradorTexto:setBloques()

### Community 26 - "NarradorObjetos.lua"
Cohesion: 0.38
Nodes (5): C.elegirEncargo(), Defs.todos(), anteponer(), O.ajustarArcos(), recorrerAcciones()

### Community 27 - "Contratos.lua"
Cohesion: 0.73
Nodes (5): comunes(), encargoAlijo(), encargoBuscar(), encargoRescate(), salidasDePlazo()

### Community 28 - "Sous.lua"
Cohesion: 0.47
Nodes (3): esconditeComun(), etapasEscuadras(), perfilesDe()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor.estado()` connect `NarradorMotor.lua` to `Mundo.horas`, `NarradorOcupaciones.lua`, `NarradorConversas.lua`, `NarradorEncuentros.lua`, `NarradorCuraServer.lua`, `NarradorKnox.lua`, `NarradorContactos.lua`, `Mundo.sandbox`, `NarradorCampamentos.lua`, `NarradorContactos.lua`, `S.pedirFavor`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 61 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `Cal.corteLuz()`) actually correct?**
  _`Motor.estado()` has 61 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorMotor.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.05897435897435897 - nodes in this community are weakly interconnected._
- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorMotor.lua`, `NarradorOcupaciones.lua`, `NarradorConversas.lua`, `NarradorEncuentros.lua`, `NarradorCuraServer.lua`, `NarradorKnox.lua`, `NarradorContactos.lua`, `NarradorMundo.lua`, `Mundo.sandbox`, `NarradorCampamentos.lua`, `NarradorContactos.lua`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Are the 76 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 76 INFERRED edges - model-reasoned connections that need verification._
- **Should `Mundo.horas` be split into smaller, more focused modules?**
  _Cohesion score 0.11522198731501057 - nodes in this community are weakly interconnected._
- **Why does `S.comprar()` connect `NarradorCampamentos.lua` to `NarradorConversas.lua`, `NarradorMotor.lua`, `NarradorContactos.lua`, `NarradorMundo.lua`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._