# Graph Report - NarradorCoop  (2026-10-16)

## Corpus Check
- 59 files · ~201,551 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 831 nodes · 2583 edges · 26 communities (25 shown, 1 thin omitted)
- Extraction: 69% EXTRACTED · 31% INFERRED · 0% AMBIGUOUS · INFERRED: 808 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8af116be`
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
- NarradorPasajeros.lua
- NarradorCuraServer.lua
- NarradorKnox.lua
- NarradorDirector.lua
- Defs.get
- NarradorLegendario.lua
- Mundo.posicionActor
- NarradorIndicadoresCalc.lua
- Cliente.recibir
- NarradorContactos.lua
- README.md
- NarradorContactos.lua
- NarradorCalendario.lua
- Mundo.horas
- Ideas futuras: campamentos de supervivientes
- NarradorMapas.lua
- Motor.procesarPendientes

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 83 edges
2. `Mundo.horas()` - 77 edges
3. `Mundo.azar()` - 58 edges
4. `Mundo.log()` - 37 edges
5. `Mundo.jugadores()` - 36 edges
6. `Motor.enviar()` - 32 edges
7. `Mundo.posicion()` - 31 edges
8. `Motor.iniciar()` - 30 edges
9. `Mundo.grupoDe()` - 30 edges
10. `C.estado()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `S.comprar()` --calls--> `L.crearAuto()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCampamentos.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorLegendario.lua
- `C.tonoKnox()` --calls--> `KD.tono()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorContactos.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorKnoxDefs.lua
- `S.residentesInfo()` --calls--> `Motor.estado()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorConversacionServer.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua
- `S.alComando()` --calls--> `Mundo.log()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorConversacionServer.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.pedirGrupo()` --calls--> `Mundo.existePerfil()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua

## Import Cycles
- None detected.

## Communities (26 total, 1 thin omitted)

### Community 0 - "NarradorMotor.lua"
Cohesion: 0.11
Nodes (35): Cal.niebla(), Cal.st(), lineasDe(), Motor.acompanarGrupo(), Motor.actualizarPropios(), Motor.alComando(), Motor.avisar(), Motor.banderasDe() (+27 more)

### Community 1 - "Mundo.horas"
Cohesion: 0.06
Nodes (80): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+72 more)

### Community 2 - "NarradorOcupaciones.lua"
Cohesion: 0.24
Nodes (17): casillaAfuera(), clave(), O.activo(), O.clasificar(), O.contar(), O.darBotin(), O.decorar(), O.estadoTexto() (+9 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (68): Cliente.enviar(), ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir() (+60 more)

### Community 4 - "NarradorDefs.lua"
Cohesion: 0.05
Nodes (47): C.elegirEncargo(), H.alTerminar(), H.anunciarTitulo(), H.completarHuella(), H.estadoTexto(), H.fama(), H.gruposDe(), H.registrar() (+39 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.07
Nodes (51): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+43 more)

### Community 6 - "NarradorCliente.lua"
Cohesion: 0.10
Nodes (22): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.alIniciar(), Cliente.cuerpoDe(), Cliente.engancharMapa(), Cliente.esAdmin(), Cliente.menu(), Cliente.miEncargo() (+14 more)

### Community 7 - "NarradorIndicadores.lua"
Cohesion: 0.11
Nodes (23): Cliente.avisarPreguntas(), Cliente.halo(), Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.cambiarModo(), Ind.crear(), Ind.diagnostico() (+15 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.12
Nodes (31): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+23 more)

### Community 9 - "NarradorPasajeros.lua"
Cohesion: 0.23
Nodes (16): C.curar(), Mundo.actorVivo(), Mundo.arreglarCarnet(), Mundo.cuerpoActor(), enAuto(), jugadorPorNombre(), P.agregar(), P.bajar() (+8 more)

### Community 10 - "NarradorCuraServer.lua"
Cohesion: 0.17
Nodes (14): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.repasoCura(), CS.st(), CS.vista(), Cura.curar() (+6 more)

### Community 11 - "NarradorKnox.lua"
Cohesion: 0.19
Nodes (15): KC.menu(), KC.miConfianza(), anotar(), avisarGrupo(), gruposDe(), KX.bandidosLimpios(), KX.despreciado(), KX.nivelDe() (+7 more)

### Community 12 - "NarradorDirector.lua"
Cohesion: 0.18
Nodes (24): Director.alIniciar(), Director.bajarTension(), Director.candidatos(), Director.elegible(), Director.estadoTexto(), Director.estilo(), Director.lanzar(), Director.lineaPara() (+16 more)

### Community 13 - "Defs.get"
Cohesion: 0.19
Nodes (20): C.encargosActivos(), C.revisarMall(), Motor.anotar(), Motor.charlar(), Motor.decir(), Motor.elegir(), Motor.entrar(), Motor.opcionVisible() (+12 more)

### Community 14 - "NarradorLegendario.lua"
Cohesion: 0.33
Nodes (9): azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.crearAuto(), L.marcar() (+1 more)

### Community 15 - "Mundo.posicionActor"
Cohesion: 0.19
Nodes (15): listasDe(), S.alComando(), S.completarArco(), S.elegirLinea(), S.frase(), S.hablar(), S.nombreDe(), S.residentesInfo() (+7 more)

### Community 16 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.22
Nodes (15): Ind.aPantalla(), Ind.textura(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+7 more)

### Community 17 - "Cliente.recibir"
Cohesion: 0.33
Nodes (7): Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.cartel(), Cliente.decir(), Cliente.marcar(), Cliente.ponerMarcas(), Cliente.recibir()

### Community 18 - "NarradorContactos.lua"
Cohesion: 0.07
Nodes (64): avisarTodos(), esCaja(), esMunicion(), esRopaSuelta(), mejorar(), porValor(), S.aparecer(), S.capituloExiste() (+56 more)

### Community 20 - "NarradorContactos.lua"
Cohesion: 0.09
Nodes (73): Cal.calor(), Cal.dulces(), Cal.ultimaNoche(), S.comprar(), S.falta(), S.nivelConfianza(), C.darMapa(), C.decir() (+65 more)

### Community 21 - "NarradorCalendario.lua"
Cohesion: 0.24
Nodes (12): Cal.amigoSecreto(), Cal.corteLuz(), Cal.eventosActivos(), Cal.fonda(), Cal.residente(), Cal.sousAliados(), Cal.tick(), Cal.una() (+4 more)

### Community 22 - "Mundo.horas"
Cohesion: 0.24
Nodes (14): anotar(), C.alMorir(), C.enterrar(), C.inmuneMurio(), C.revisarDesbloqueo(), Director.abrirPendientes(), Director.anotar(), Director.procesarAgenda() (+6 more)

### Community 23 - "Ideas futuras: campamentos de supervivientes"
Cohesion: 0.08
Nodes (25): A. Eventos fortuitos de Eduardo (después de conocerlo), B. El camino del bandido (Knox negativo), Brújula sigue a la cámara (hecho, falta probar en el juego), C. Modo historia de los misioneros, Campamentos con niveles y comerciantes (hecho, falta probar), Diario en lápiz pasta azul (hecho, falta probar en el juego), Encuentros: llevar a la persona al campamento (hecho, falta probar), Estético (+17 more)

### Community 24 - "NarradorMapas.lua"
Cohesion: 0.26
Nodes (9): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+1 more)

### Community 25 - "Motor.procesarPendientes"
Cohesion: 0.38
Nodes (7): grupo(), Motor.procesarPendientes(), Motor.retirarGrupo(), Motor.transformar(), Motor.valor(), Mundo.retirar(), Mundo.zombiEn()

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor.estado()` connect `NarradorMotor.lua` to `Mundo.horas`, `NarradorOcupaciones.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorPasajeros.lua`, `NarradorCuraServer.lua`, `NarradorKnox.lua`, `NarradorDirector.lua`, `Defs.get`, `Mundo.posicionActor`, `NarradorContactos.lua`, `NarradorContactos.lua`, `NarradorCalendario.lua`, `Mundo.horas`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Are the 59 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `Cal.corteLuz()`) actually correct?**
  _`Motor.estado()` has 59 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorMotor.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.10661268556005399 - nodes in this community are weakly interconnected._
- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorMotor.lua`, `Mundo.horas`, `NarradorOcupaciones.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorCuraServer.lua`, `NarradorKnox.lua`, `NarradorDirector.lua`, `Defs.get`, `NarradorContactos.lua`, `NarradorContactos.lua`, `NarradorCalendario.lua`, `Motor.procesarPendientes`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 75 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 75 INFERRED edges - model-reasoned connections that need verification._
- **Should `Mundo.horas` be split into smaller, more focused modules?**
  _Cohesion score 0.05637840420449116 - nodes in this community are weakly interconnected._
- **Why does `S.comprar()` connect `NarradorContactos.lua` to `Mundo.horas`, `NarradorKnox.lua`, `NarradorLegendario.lua`, `Mundo.posicionActor`, `NarradorContactos.lua`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._