# Graph Report - NarradorCoop  (2026-10-16)

## Corpus Check
- 59 files · ~202,990 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 840 nodes · 2620 edges · 26 communities (24 shown, 2 thin omitted)
- Extraction: 68% EXTRACTED · 32% INFERRED · 0% AMBIGUOUS · INFERRED: 828 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `298229a4`
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
- Generados.lua
- NarradorCuraServer.lua
- NarradorKnox.lua
- S.pedirFavor
- NarradorMundo.lua
- NarradorLegendario.lua
- NarradorObjetos.lua
- NarradorIndicadoresCalc.lua
- NarradorObjetosServer.lua
- NarradorContactos.lua
- README.md
- NarradorContactos.lua
- Contratos.lua
- Sous.lua
- Ideas futuras: campamentos de supervivientes
- NarradorMapas.lua
- envolver

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 84 edges
2. `Mundo.horas()` - 78 edges
3. `Mundo.azar()` - 58 edges
4. `Mundo.log()` - 37 edges
5. `Mundo.jugadores()` - 36 edges
6. `Motor.enviar()` - 33 edges
7. `Mundo.posicion()` - 32 edges
8. `Mundo.grupoDe()` - 32 edges
9. `Motor.iniciar()` - 30 edges
10. `C.estado()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `S.comprar()` --calls--> `L.crearAuto()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCampamentos.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorLegendario.lua
- `CS.repasoCura()` --calls--> `Cura.infectado()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCuraServer.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorCura.lua
- `Motor.transformar()` --calls--> `Mundo.zombiEn()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.pedirGrupo()` --calls--> `Mundo.existePerfil()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.elegir()` --calls--> `Mundo.tieneEtiqueta()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua

## Import Cycles
- None detected.

## Communities (26 total, 2 thin omitted)

### Community 0 - "NarradorMotor.lua"
Cohesion: 0.07
Nodes (85): C.alMorir(), C.encargosActivos(), C.enterrar(), C.inmuneMurio(), C.revisarDesbloqueo(), C.revisarMall(), C.revisarRegresos(), listasDe() (+77 more)

### Community 1 - "Mundo.horas"
Cohesion: 0.07
Nodes (73): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+65 more)

### Community 2 - "NarradorOcupaciones.lua"
Cohesion: 0.12
Nodes (31): C.curar(), Mundo.cuerpoActor(), casillaAfuera(), clave(), O.activo(), O.clasificar(), O.contar(), O.darBotin() (+23 more)

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
Cohesion: 0.13
Nodes (29): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+21 more)

### Community 9 - "Generados.lua"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 10 - "NarradorCuraServer.lua"
Cohesion: 0.17
Nodes (13): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.st(), CS.vista(), Cura.curar(), Cura.dolor() (+5 more)

### Community 11 - "NarradorKnox.lua"
Cohesion: 0.12
Nodes (28): C.tonoKnox(), H.alTerminar(), H.anunciarTitulo(), H.completarHuella(), H.estadoTexto(), H.fama(), H.gruposDe(), H.registrar() (+20 more)

### Community 12 - "S.pedirFavor"
Cohesion: 0.42
Nodes (8): S.alComando(), S.favoresDisponibles(), S.pedirFavor(), F.def(), F.disponible(), F.idDe(), F.residente(), registrarFavor()

### Community 13 - "NarradorMundo.lua"
Cohesion: 0.08
Nodes (38): Director.revisarVisitas(), contarTipos(), H.dispararEco(), calza(), centro(), elegirSala(), mismasBanderas(), Mundo.acompanar() (+30 more)

### Community 14 - "NarradorLegendario.lua"
Cohesion: 0.33
Nodes (9): azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.crearAuto(), L.marcar() (+1 more)

### Community 15 - "NarradorObjetos.lua"
Cohesion: 0.38
Nodes (5): C.elegirEncargo(), Defs.todos(), anteponer(), O.ajustarArcos(), recorrerAcciones()

### Community 16 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.20
Nodes (16): Ind.aPantalla(), Ind.objetivos(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+8 more)

### Community 17 - "NarradorObjetosServer.lua"
Cohesion: 0.53
Nodes (4): Mundo.crearMapa(), Mundo.crearMapaZona(), S.crearMapa(), S.zona()

### Community 18 - "NarradorContactos.lua"
Cohesion: 0.06
Nodes (66): KC.despreciado(), KC.menu(), KC.menuCatalogo(), KC.miConfianza(), anotar(), avisarTodos(), esCaja(), esMunicion() (+58 more)

### Community 20 - "NarradorContactos.lua"
Cohesion: 0.07
Nodes (94): Cal.amigoSecreto(), Cal.calor(), Cal.corteLuz(), Cal.dulces(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla(), Cal.residente() (+86 more)

### Community 21 - "Contratos.lua"
Cohesion: 0.73
Nodes (5): comunes(), encargoAlijo(), encargoBuscar(), encargoRescate(), salidasDePlazo()

### Community 22 - "Sous.lua"
Cohesion: 0.47
Nodes (3): esconditeComun(), etapasEscuadras(), perfilesDe()

### Community 23 - "Ideas futuras: campamentos de supervivientes"
Cohesion: 0.08
Nodes (25): A. Eventos fortuitos de Eduardo (después de conocerlo), B. El camino del bandido (Knox negativo), Brújula sigue a la cámara (hecho, falta probar en el juego), C. Modo historia de los misioneros, Campamentos con niveles y comerciantes (hecho, falta probar), Diario en lápiz pasta azul (hecho, falta probar en el juego), Encuentros: llevar a la persona al campamento (hecho, falta probar), Estético (+17 more)

### Community 24 - "NarradorMapas.lua"
Cohesion: 0.26
Nodes (9): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+1 more)

### Community 25 - "envolver"
Cohesion: 0.40
Nodes (5): envolver(), NarradorMensaje:mostrar(), NarradorTexto:limitarScroll(), NarradorTexto:onMouseWheel(), NarradorTexto:setBloques()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor.estado()` connect `NarradorMotor.lua` to `Mundo.horas`, `NarradorOcupaciones.lua`, `NarradorConversas.lua`, `NarradorCuraServer.lua`, `NarradorKnox.lua`, `S.pedirFavor`, `NarradorMundo.lua`, `NarradorContactos.lua`, `NarradorContactos.lua`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Are the 60 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `Cal.corteLuz()`) actually correct?**
  _`Motor.estado()` has 60 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorMotor.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.06741573033707865 - nodes in this community are weakly interconnected._
- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorMotor.lua`, `NarradorOcupaciones.lua`, `NarradorConversas.lua`, `NarradorCuraServer.lua`, `NarradorKnox.lua`, `NarradorMundo.lua`, `NarradorContactos.lua`, `NarradorContactos.lua`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 76 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 76 INFERRED edges - model-reasoned connections that need verification._
- **Should `Mundo.horas` be split into smaller, more focused modules?**
  _Cohesion score 0.07425907425907426 - nodes in this community are weakly interconnected._
- **Why does `S.comprar()` connect `NarradorContactos.lua` to `NarradorMotor.lua`, `NarradorContactos.lua`, `NarradorMundo.lua`, `NarradorLegendario.lua`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._