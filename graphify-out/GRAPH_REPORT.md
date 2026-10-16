# Graph Report - NarradorCoop  (2026-10-16)

## Corpus Check
- 60 files · ~206,069 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 852 nodes · 2687 edges · 25 communities (23 shown, 2 thin omitted)
- Extraction: 68% EXTRACTED · 32% INFERRED · 0% AMBIGUOUS · INFERRED: 862 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `495de265`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- NarradorMotor.lua
- Mundo.azar
- NarradorOcupaciones.lua
- NarradorConversacion.lua
- NarradorDefs.lua
- NarradorDiario.lua
- NarradorCliente.lua
- NarradorIndicadores.lua
- NarradorConversas.lua
- NarradorHuellas.lua
- NarradorCuraServer.lua
- NarradorKnox.lua
- NarradorContactos.lua
- NarradorMundo.lua
- NarradorIndicadoresCalc.lua
- NarradorMapas.lua
- NarradorLegendario.lua
- README.md
- NarradorContactos.lua
- Generados.lua
- S.pedirFavor
- Ideas futuras: campamentos de supervivientes
- envolver
- Contratos.lua
- Sous.lua

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 85 edges
2. `Mundo.horas()` - 84 edges
3. `Mundo.azar()` - 60 edges
4. `Mundo.log()` - 38 edges
5. `Mundo.jugadores()` - 38 edges
6. `Motor.enviar()` - 35 edges
7. `Mundo.posicion()` - 34 edges
8. `Mundo.grupoDe()` - 33 edges
9. `C.estado()` - 31 edges
10. `Motor.iniciar()` - 31 edges

## Surprising Connections (you probably didn't know these)
- `S.juntar()` --calls--> `K.valorMedicina()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCampamentos.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorCampamentosDefs.lua
- `S.juntar()` --calls--> `K.valorPrenda()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCampamentos.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorCampamentosDefs.lua
- `S.comprar()` --calls--> `L.crearAuto()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCampamentos.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorLegendario.lua
- `C.tonoKnox()` --calls--> `KD.tono()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorContactos.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorKnoxDefs.lua
- `KX.gruposDeFin()` --calls--> `H.gruposDe()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorKnox.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorHuellas.lua

## Import Cycles
- None detected.

## Communities (25 total, 2 thin omitted)

### Community 0 - "NarradorMotor.lua"
Cohesion: 0.07
Nodes (87): C.alMorir(), C.encargosActivos(), C.enterrar(), C.inmuneMurio(), C.inmunes(), C.revisarDesbloqueo(), C.revisarMall(), C.tickMinuto() (+79 more)

### Community 1 - "Mundo.azar"
Cohesion: 0.08
Nodes (61): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+53 more)

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
Nodes (31): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+23 more)

### Community 9 - "NarradorHuellas.lua"
Cohesion: 0.38
Nodes (11): H.alTerminar(), H.completarHuella(), H.dispararEco(), H.estadoTexto(), H.fama(), H.registrar(), H.st(), H.tick() (+3 more)

### Community 10 - "NarradorCuraServer.lua"
Cohesion: 0.17
Nodes (14): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.repasoCura(), CS.st(), CS.vista(), Cura.curar() (+6 more)

### Community 11 - "NarradorKnox.lua"
Cohesion: 0.18
Nodes (16): anotar(), avisarGrupo(), KX.alMorirNpc(), KX.bandidosLimpios(), KX.despreciado(), KX.esHostil(), KX.gruposDeFin(), KX.nivelDe() (+8 more)

### Community 12 - "NarradorContactos.lua"
Cohesion: 0.07
Nodes (61): anotar(), avisarTodos(), banderasGuardia(), esCaja(), esMunicion(), esRopaSuelta(), mejorar(), porValor() (+53 more)

### Community 13 - "NarradorMundo.lua"
Cohesion: 0.06
Nodes (55): Director.anotar(), Director.revisarVisitas(), contarTipos(), calza(), casillaLibre(), centro(), elegirSala(), mismasBanderas() (+47 more)

### Community 16 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.20
Nodes (16): Ind.aPantalla(), Ind.objetivos(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+8 more)

### Community 17 - "NarradorMapas.lua"
Cohesion: 0.26
Nodes (9): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+1 more)

### Community 18 - "NarradorLegendario.lua"
Cohesion: 0.14
Nodes (18): KC.despreciado(), KC.menu(), KC.menuCatalogo(), KC.miConfianza(), S.recadoActual(), K.generarRecado(), K.precio(), K.valorMedicina() (+10 more)

### Community 20 - "NarradorContactos.lua"
Cohesion: 0.06
Nodes (106): Cal.amigoSecreto(), Cal.brujasNoche(), Cal.calor(), Cal.corteLuz(), Cal.dulces(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla() (+98 more)

### Community 21 - "Generados.lua"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 22 - "S.pedirFavor"
Cohesion: 0.23
Nodes (13): Mundo.crearMapa(), Mundo.crearMapaZona(), S.alComando(), S.casillaConPared(), S.crearMapa(), S.favoresDisponibles(), S.pedirFavor(), S.zona() (+5 more)

### Community 23 - "Ideas futuras: campamentos de supervivientes"
Cohesion: 0.08
Nodes (25): A. Eventos fortuitos de Eduardo (después de conocerlo), B. El camino del bandido (Knox negativo), Brújula sigue a la cámara (hecho, falta probar en el juego), C. Modo historia de los misioneros, Campamentos con niveles y comerciantes (hecho, falta probar), Diario en lápiz pasta azul (hecho, falta probar en el juego), Encuentros: llevar a la persona al campamento (hecho, falta probar), Estético (+17 more)

### Community 25 - "envolver"
Cohesion: 0.40
Nodes (5): envolver(), NarradorMensaje:mostrar(), NarradorTexto:limitarScroll(), NarradorTexto:onMouseWheel(), NarradorTexto:setBloques()

### Community 27 - "Contratos.lua"
Cohesion: 0.73
Nodes (5): comunes(), encargoAlijo(), encargoBuscar(), encargoRescate(), salidasDePlazo()

### Community 28 - "Sous.lua"
Cohesion: 0.25
Nodes (6): esconditeComun(), etapasEscuadras(), perfilesDe(), anteponer(), O.ajustarArcos(), recorrerAcciones()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor.estado()` connect `NarradorMotor.lua` to `Mundo.azar`, `NarradorOcupaciones.lua`, `NarradorConversas.lua`, `NarradorHuellas.lua`, `NarradorCuraServer.lua`, `NarradorKnox.lua`, `NarradorContactos.lua`, `NarradorMundo.lua`, `NarradorContactos.lua`, `S.pedirFavor`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Are the 61 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `Cal.corteLuz()`) actually correct?**
  _`Motor.estado()` has 61 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorMotor.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.06569517439082656 - nodes in this community are weakly interconnected._
- **Why does `Mundo.horas()` connect `NarradorConversas.lua` to `NarradorMotor.lua`, `Mundo.azar`, `NarradorOcupaciones.lua`, `NarradorHuellas.lua`, `NarradorCuraServer.lua`, `NarradorKnox.lua`, `NarradorContactos.lua`, `NarradorMundo.lua`, `NarradorContactos.lua`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Are the 82 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 82 INFERRED edges - model-reasoned connections that need verification._
- **Should `Mundo.azar` be split into smaller, more focused modules?**
  _Cohesion score 0.07925407925407925 - nodes in this community are weakly interconnected._
- **Why does `S.comprar()` connect `NarradorContactos.lua` to `NarradorMotor.lua`, `NarradorLegendario.lua`, `NarradorContactos.lua`, `NarradorMundo.lua`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._