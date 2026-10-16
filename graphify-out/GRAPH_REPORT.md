# Graph Report - NarradorCoop  (2026-10-16)

## Corpus Check
- 60 files · ~207,235 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 859 nodes · 2709 edges · 28 communities (26 shown, 2 thin omitted)
- Extraction: 68% EXTRACTED · 32% INFERRED · 0% AMBIGUOUS · INFERRED: 871 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a5e17c03`
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
- NarradorPasajeros.lua
- NarradorObjetosServer.lua
- NarradorIndicadoresCalc.lua
- NarradorMapas.lua
- NarradorLegendario.lua
- README.md
- NarradorContactos.lua
- Generados.lua
- S.pedirFavor
- Ideas futuras: campamentos de supervivientes
- NarradorObjetos.lua
- envolver
- Contratos.lua
- Sous.lua

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 85 edges
2. `Mundo.horas()` - 85 edges
3. `Mundo.azar()` - 61 edges
4. `Mundo.log()` - 38 edges
5. `Mundo.jugadores()` - 38 edges
6. `Motor.enviar()` - 35 edges
7. `Mundo.posicion()` - 34 edges
8. `Mundo.grupoDe()` - 33 edges
9. `C.estado()` - 31 edges
10. `Motor.iniciar()` - 31 edges

## Surprising Connections (you probably didn't know these)
- `S.estado()` --calls--> `K.reservasIniciales()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCampamentos.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorCampamentosDefs.lua
- `S.enAtaque()` --calls--> `C.estado()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCampamentos.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorContactos.lua
- `S.comprar()` --calls--> `L.crearAuto()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCampamentos.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorLegendario.lua
- `S.alComando()` --calls--> `Mundo.log()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorConversacionServer.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `CS.repasoCura()` --calls--> `Cura.infectado()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCuraServer.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorCura.lua

## Import Cycles
- None detected.

## Communities (28 total, 2 thin omitted)

### Community 0 - "NarradorMotor.lua"
Cohesion: 0.06
Nodes (90): C.encargosActivos(), C.limpiar(), C.revisarMall(), C.revisarRegresos(), C.zonaSegura(), listasDe(), S.alComando(), S.completarArco() (+82 more)

### Community 1 - "Mundo.azar"
Cohesion: 0.06
Nodes (93): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+85 more)

### Community 2 - "NarradorOcupaciones.lua"
Cohesion: 0.23
Nodes (18): casillaAfuera(), clave(), O.activo(), O.clasificar(), O.contar(), O.darBotin(), O.decorar(), O.deMisionero() (+10 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (67): ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir(), Conv.crearRastreador() (+59 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.09
Nodes (45): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+37 more)

### Community 6 - "NarradorCliente.lua"
Cohesion: 0.10
Nodes (26): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.alIniciar(), Cliente.cartel(), Cliente.cuerpoDe(), Cliente.decir() (+18 more)

### Community 7 - "NarradorIndicadores.lua"
Cohesion: 0.12
Nodes (21): Cliente.avisarPreguntas(), Cliente.halo(), Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.cambiarModo(), Ind.crear(), Ind.diagnostico() (+13 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.13
Nodes (29): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+21 more)

### Community 9 - "NarradorHuellas.lua"
Cohesion: 0.30
Nodes (13): H.alTerminar(), H.anunciarTitulo(), H.completarHuella(), H.estadoTexto(), H.fama(), H.gruposDe(), H.registrar(), H.st() (+5 more)

### Community 10 - "NarradorCuraServer.lua"
Cohesion: 0.17
Nodes (13): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.st(), CS.vista(), Cura.curar(), Cura.dolor() (+5 more)

### Community 11 - "NarradorKnox.lua"
Cohesion: 0.12
Nodes (25): KC.despreciado(), KC.menu(), KC.menuCatalogo(), KC.miConfianza(), KC.textoReservas(), C.inmunes(), C.onNpcMuerto(), C.tonoKnox() (+17 more)

### Community 12 - "NarradorContactos.lua"
Cohesion: 0.07
Nodes (46): banderasGuardia(), esCaja(), esMunicion(), esRopaSuelta(), porValor(), S.aparecer(), S.aparecerGuardia(), S.capituloExiste() (+38 more)

### Community 13 - "NarradorMundo.lua"
Cohesion: 0.08
Nodes (35): mejorar(), S.comprar(), S.forjar(), contarTipos(), calza(), centro(), elegirSala(), mismasBanderas() (+27 more)

### Community 14 - "NarradorPasajeros.lua"
Cohesion: 0.25
Nodes (15): C.curar(), Mundo.arreglarCarnet(), Mundo.cuerpoActor(), enAuto(), jugadorPorNombre(), P.agregar(), P.bajar(), P.esAcompanante() (+7 more)

### Community 15 - "NarradorObjetosServer.lua"
Cohesion: 0.43
Nodes (5): Mundo.crearMapa(), Mundo.crearMapaZona(), S.casillaConPared(), S.crearMapa(), S.zona()

### Community 16 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.20
Nodes (16): Ind.aPantalla(), Ind.objetivos(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+8 more)

### Community 17 - "NarradorMapas.lua"
Cohesion: 0.26
Nodes (9): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+1 more)

### Community 18 - "NarradorLegendario.lua"
Cohesion: 0.29
Nodes (10): K.generarRecado(), azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.crearAuto() (+2 more)

### Community 20 - "NarradorContactos.lua"
Cohesion: 0.06
Nodes (100): Cal.amigoSecreto(), Cal.calor(), Cal.corteLuz(), Cal.dulces(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla(), Cal.residente() (+92 more)

### Community 21 - "Generados.lua"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 22 - "S.pedirFavor"
Cohesion: 0.42
Nodes (8): S.alComando(), S.favoresDisponibles(), S.pedirFavor(), F.def(), F.disponible(), F.idDe(), F.residente(), registrarFavor()

### Community 23 - "Ideas futuras: campamentos de supervivientes"
Cohesion: 0.07
Nodes (26): A. Eventos fortuitos de Eduardo (después de conocerlo), B. El camino del bandido (Knox negativo), Brújula sigue a la cámara (hecho, falta probar en el juego), C. Modo historia de los misioneros, Campamentos con niveles y comerciantes (hecho, falta probar), Diario en lápiz pasta azul (hecho, falta probar en el juego), Encuentros: llevar a la persona al campamento (hecho, falta probar), Estético (+18 more)

### Community 24 - "NarradorObjetos.lua"
Cohesion: 0.38
Nodes (5): C.elegirEncargo(), Defs.todos(), anteponer(), O.ajustarArcos(), recorrerAcciones()

### Community 25 - "envolver"
Cohesion: 0.40
Nodes (5): envolver(), NarradorMensaje:mostrar(), NarradorTexto:limitarScroll(), NarradorTexto:onMouseWheel(), NarradorTexto:setBloques()

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

- **Why does `Motor.estado()` connect `NarradorMotor.lua` to `Mundo.azar`, `NarradorOcupaciones.lua`, `NarradorConversas.lua`, `NarradorHuellas.lua`, `NarradorCuraServer.lua`, `NarradorKnox.lua`, `NarradorContactos.lua`, `NarradorPasajeros.lua`, `NarradorContactos.lua`, `S.pedirFavor`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Are the 61 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `Cal.corteLuz()`) actually correct?**
  _`Motor.estado()` has 61 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorMotor.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.05659583420997265 - nodes in this community are weakly interconnected._
- **Why does `Mundo.horas()` connect `Mundo.azar` to `NarradorMotor.lua`, `NarradorOcupaciones.lua`, `NarradorConversas.lua`, `NarradorHuellas.lua`, `NarradorCuraServer.lua`, `NarradorKnox.lua`, `NarradorContactos.lua`, `NarradorMundo.lua`, `NarradorContactos.lua`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Are the 83 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 83 INFERRED edges - model-reasoned connections that need verification._
- **Should `Mundo.azar` be split into smaller, more focused modules?**
  _Cohesion score 0.06438039133179045 - nodes in this community are weakly interconnected._
- **Why does `S.comprar()` connect `NarradorMundo.lua` to `NarradorMotor.lua`, `Mundo.azar`, `NarradorKnox.lua`, `NarradorContactos.lua`, `NarradorLegendario.lua`, `NarradorContactos.lua`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._