# Graph Report - NarradorCoop  (2026-11-04)

## Corpus Check
- 105 files · ~509,150 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: .X 19, (none) 1, .jar 1)

## Summary
- 1206 nodes · 3747 edges · 52 communities (45 shown, 7 thin omitted)
- Extraction: 66% EXTRACTED · 34% INFERRED · 0% AMBIGUOUS · INFERRED: 1278 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9c2bde11`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- NarradorDirector.lua
- NarradorContactos.lua
- NarradorMotor.lua
- NarradorConversacion.lua
- NarradorMundo.lua
- NarradorDiario.lua
- NarradorCampamentos.lua
- NarradorKnox.lua
- NarradorConversas.lua
- NarradorDominios.lua
- NarradorCliente.lua
- NarradorBandido.lua
- NarradorIndicadores.lua
- NarradorDefs.lua
- NarradorIndicadoresCalc.lua
- NarradorPasajeros.lua
- NarradorOcupaciones.lua
- NarradorVidas.lua
- NarradorLore.lua
- Ind.menu
- NarradorContactos.lua
- NarradorLegendario.lua
- Generados.lua
- S.pedirFavor
- Motor.estado
- Contratos.lua
- Sous.lua
- NarradorObjetos.lua
- README.md
- Mundo.posicion
- Mundo.horas
- Mundo.jugadores
- NarradorPasajeros.lua
- NarradorMotor.lua
- NarradorViewpoint
- NarradorEncuentros.lua
- C.estado
- NarradorMotorGrupos.lua
- NarradorOcupaciones.lua
- Mundo.log
- NarradorConversacionServer.lua
- Motor.cumple
- HistoriasSous2.lua
- Capitulos.lua
- HistoriasSous1.lua
- NarradorRepararCliente.lua
- Motor.publicar
- NarradorLegendario.lua
- Mundo.crearItem
- Mundo.azar
- S.comprar

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 145 edges
2. `Mundo.horas()` - 110 edges
3. `Mundo.azar()` - 75 edges
4. `Mundo.log()` - 67 edges
5. `Mundo.jugadores()` - 49 edges
6. `Motor.enviar()` - 46 edges
7. `Mundo.grupoDe()` - 40 edges
8. `Motor.publicar()` - 39 edges
9. `Mundo.cargado()` - 39 edges
10. `C.estado()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `BA.tick()` --calls--> `Mundo.hayALife()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorBandido.lua → 42/media/lua/server/Narrador/NarradorMundoALife.lua
- `CO.estanque()` --calls--> `Mundo.llenarBencina()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorConsecuencias.lua → 42/media/lua/server/Narrador/NarradorMundo.lua
- `C.enterrar()` --calls--> `Mundo.quitarCadaver()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorContactos.lua → 42/media/lua/server/Narrador/NarradorMundo.lua
- `S.residentesInfo()` --calls--> `Motor.estado()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorConversacionServer.lua → 42/media/lua/server/Narrador/NarradorMotor.lua
- `S.alComando()` --calls--> `Mundo.log()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorConversacionServer.lua → 42/media/lua/server/Narrador/NarradorMundo.lua

## Import Cycles
- None detected.

## Communities (52 total, 7 thin omitted)

### Community 0 - "NarradorDirector.lua"
Cohesion: 0.16
Nodes (28): Director.activos(), Director.alIniciar(), Director.bajarTension(), Director.candidatos(), Director.contarRumores(), Director.cuentaEnCupo(), Director.elegible(), Director.estadoTexto() (+20 more)

### Community 1 - "NarradorContactos.lua"
Cohesion: 0.09
Nodes (70): Cal.dulces(), S.nivelConfianza(), C.darMapa(), C.decir(), C.def(), C.distancia(), C.encargoDelGrupo(), C.extra() (+62 more)

### Community 2 - "NarradorMotor.lua"
Cohesion: 0.09
Nodes (20): contarTipos(), casillaLibre(), Mundo.atraer(), Mundo.buscarItems(), Mundo.corredores(), Mundo.datosGuardados(), Mundo.dejarEnSuelo(), Mundo.enviarCliente() (+12 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.06
Nodes (71): ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir(), Conv.crearRastreador() (+63 more)

### Community 4 - "NarradorMundo.lua"
Cohesion: 0.15
Nodes (14): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.repasoCura(), CS.st(), CS.vista(), Cura.curar() (+6 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.07
Nodes (69): agregar(), capitulosCerrados(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion() (+61 more)

### Community 6 - "NarradorCampamentos.lua"
Cohesion: 0.13
Nodes (32): avisarTodos(), banderasGuardia(), esCaja(), esMunicion(), esRopaSuelta(), mejorar(), porValor(), S.aparecer() (+24 more)

### Community 7 - "NarradorKnox.lua"
Cohesion: 0.06
Nodes (37): C.tonoKnox(), H.alTerminar(), H.anunciarTitulo(), H.completarHuella(), H.estadoTexto(), H.fama(), H.gruposDe(), H.registrar() (+29 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.12
Nodes (29): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+21 more)

### Community 9 - "NarradorDominios.lua"
Cohesion: 0.09
Nodes (30): KC.despreciado(), KC.menu(), KC.menuCatalogo(), KC.miConfianza(), KC.textoReservas(), CA.anotar(), CA.anotarContacto(), CA.revisar() (+22 more)

### Community 10 - "NarradorCliente.lua"
Cohesion: 0.09
Nodes (23): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.alIniciar(), Cliente.cuerpoDe(), Cliente.engancharMapa(), Cliente.enviar(), Cliente.esAdmin(), Cliente.menu() (+15 more)

### Community 11 - "NarradorBandido.lua"
Cohesion: 0.20
Nodes (17): BA.alTerminar(), BA.consecuenciaUltimo(), BA.enCurso(), BA.esDelBandido(), BA.jefe(), BA.jefeCorto(), BA.lanzar(), BA.revisar() (+9 more)

### Community 12 - "NarradorIndicadores.lua"
Cohesion: 0.13
Nodes (17): Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.crear(), Ind.diagnostico(), Ind.hayViewpoint(), Ind.leer(), Ind.mirada() (+9 more)

### Community 14 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.18
Nodes (17): Ind.aPantalla(), Ind.objetivos(), Ind.textura(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso() (+9 more)

### Community 15 - "NarradorPasajeros.lua"
Cohesion: 0.21
Nodes (18): C.encargosActivos(), C.revisarMall(), G.capituloEscrito(), Motor.anotar(), Motor.decir(), Motor.elegir(), Motor.entrar(), Motor.radioEtapa() (+10 more)

### Community 16 - "NarradorOcupaciones.lua"
Cohesion: 0.08
Nodes (29): apiSimbolos(), datosDe(), fuenteTexto(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu() (+21 more)

### Community 17 - "NarradorVidas.lua"
Cohesion: 0.17
Nodes (17): bloqueada(), contiene(), etapasDe(), indexar(), mayus(), sacar(), V.armar(), V.calza() (+9 more)

### Community 18 - "NarradorLore.lua"
Cohesion: 0.18
Nodes (6): Motor.loreTexto(), Motor.vistaLore(), Lore.de(), Lore.etapa(), Lore.final(), Lore.intro()

### Community 19 - "Ind.menu"
Cohesion: 0.21
Nodes (13): Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.avisarPreguntas(), Cliente.cartel(), Cliente.decir(), Cliente.halo(), Cliente.marcar(), Cliente.ponerMarcas() (+5 more)

### Community 20 - "NarradorContactos.lua"
Cohesion: 0.18
Nodes (18): abierta(), C.anotarPuertas(), C.cajaEdificio(), C.cuerpoMuerto(), C.curarPuertas(), C.inmuneMurio(), C.inmunes(), C.onNpcMuerto() (+10 more)

### Community 21 - "NarradorLegendario.lua"
Cohesion: 0.23
Nodes (13): Cal.amigoSecreto(), Cal.corteLuz(), Cal.eventosActivos(), Cal.fonda(), Cal.residente(), Cal.sousAliados(), Cal.tick(), Cal.ultimaNoche() (+5 more)

### Community 22 - "Generados.lua"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 23 - "S.pedirFavor"
Cohesion: 0.11
Nodes (36): MQ.buscar(), MQ.casillaJunto(), MQ.poner(), MQ.revisar(), Mundo.cargado(), adentro(), alturaMesa(), anillos() (+28 more)

### Community 24 - "Motor.estado"
Cohesion: 0.19
Nodes (16): C.revisarDesbloqueo(), C.revisarRegresos(), Director.abrirPendientes(), EV.puede(), EV.revisar(), EV.tick(), H.disponible(), H.ocupado() (+8 more)

### Community 25 - "Contratos.lua"
Cohesion: 0.73
Nodes (5): comunes(), encargoAlijo(), encargoBuscar(), encargoRescate(), salidasDePlazo()

### Community 26 - "Sous.lua"
Cohesion: 0.28
Nodes (3): esconditeComun(), etapasEscuadras(), perfilesDe()

### Community 27 - "NarradorObjetos.lua"
Cohesion: 0.38
Nodes (5): C.elegirEncargo(), Defs.todos(), anteponer(), O.ajustarArcos(), recorrerAcciones()

### Community 28 - "README.md"
Cohesion: 0.27
Nodes (14): avisarCerca(), B.aparecer(), B.huir(), B.limpiarCasa(), B.peligro(), B.rondar(), B.rondarHistoria(), B.sacar() (+6 more)

### Community 29 - "Mundo.posicion"
Cohesion: 0.22
Nodes (18): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+10 more)

### Community 30 - "Mundo.horas"
Cohesion: 0.27
Nodes (15): Cal.calor(), Cal.niebla(), Cal.st(), Cal.tormenta(), anotar(), S.empezarAtaque(), S.gastar(), S.revisarAtaque() (+7 more)

### Community 31 - "Mundo.jugadores"
Cohesion: 0.32
Nodes (14): jugadoresDe(), B.migrar(), Cal.brujasNoche(), C.jugadoresDelGrupo(), Director.procesarAgenda(), jugadorDe(), Motor.historiaAbierta(), Motor.revisarRefugio() (+6 more)

### Community 32 - "NarradorPasajeros.lua"
Cohesion: 0.06
Nodes (60): C.cuerpoRoto(), C.curar(), C.npcEnPuesto(), Motor.actualizarPropios(), Motor.avisar(), Motor.distanciaAGrupo(), Motor.vacia(), lineasDe() (+52 more)

### Community 33 - "NarradorMotor.lua"
Cohesion: 0.13
Nodes (18): hayContadorDeBajas(), Motor.alComando(), Motor.avisarContador(), Motor.cancelar(), Motor.contarBajas(), Motor.darMapaZona(), Motor.forzarEtapa(), Motor.infoAdmin() (+10 more)

### Community 35 - "NarradorEncuentros.lua"
Cohesion: 0.25
Nodes (12): E.activo(), E.direccion(), E.elegirTipo(), E.estado(), E.lanzar(), E.misioneroCercano(), E.nivelSandbox(), E.revisarJugador() (+4 more)

### Community 36 - "C.estado"
Cohesion: 0.23
Nodes (10): S.enAtaque(), CO.arsenal(), CO.estanque(), C.desbloqueado(), C.encargoActivo(), C.estado(), C.migrarDesbloqueo(), C.tick() (+2 more)

### Community 37 - "NarradorMotorGrupos.lua"
Cohesion: 0.19
Nodes (18): Motor.cantidad(), Motor.copiar(), Motor.sortear(), Motor.diferir(), Motor.acompanarGrupo(), Motor.banderasDe(), Motor.banderasGrupo(), Motor.completarGrupo() (+10 more)

### Community 38 - "NarradorOcupaciones.lua"
Cohesion: 0.24
Nodes (17): casillaAfuera(), clave(), O.activo(), O.clasificar(), O.contar(), O.darBotin(), O.decorar(), O.deMisionero() (+9 more)

### Community 39 - "Mundo.log"
Cohesion: 0.17
Nodes (17): B.alVolver(), C.alMorir(), C.enterrar(), C.limpiar(), C.reponerUnaVez(), C.zonaSegura(), Motor.procesarPendientes(), Motor.tick() (+9 more)

### Community 40 - "NarradorConversacionServer.lua"
Cohesion: 0.29
Nodes (10): listasDe(), S.alComando(), S.completarArco(), S.elegirLinea(), S.frase(), S.hablar(), S.nombreDe(), S.residentesInfo() (+2 more)

### Community 41 - "Motor.cumple"
Cohesion: 0.22
Nodes (9): Motor.opcionVisible(), Motor.valor(), Motor.copiarPlano(), Motor.ejecutar(), Motor.resolverVars(), Motor.tamanoHorda(), Motor.transformar(), Motor.cumple() (+1 more)

### Community 46 - "Motor.publicar"
Cohesion: 0.24
Nodes (16): S.tick(), C.aparecer(), C.reponer(), ED.aparecer(), ED.corresponde(), ED.enHistoria(), ED.sigueme(), ED.st() (+8 more)

### Community 47 - "NarradorLegendario.lua"
Cohesion: 0.32
Nodes (10): H.crearArma(), NarradorArmaMisioneroCreada(), azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear() (+2 more)

### Community 48 - "Mundo.crearItem"
Cohesion: 0.28
Nodes (13): C.armaKit(), Director.casillaEnSala(), Director.dejarPremio(), Director.dondeAdentro(), Director.revisarVisitas(), H.crearArma(), H.crearArmas(), Mundo.crearItem() (+5 more)

### Community 49 - "Mundo.azar"
Cohesion: 0.45
Nodes (11): calza(), centro(), elegirSala(), Mundo.azar(), Mundo.buscarCercaDe(), Mundo.buscarEnPueblo(), Mundo.buscarLugar(), Mundo.describir() (+3 more)

### Community 50 - "S.comprar"
Cohesion: 0.29
Nodes (9): S.comprar(), S.forjar(), Mundo.darItem(), Mundo.esAdmin(), Mundo.esServidor(), Mundo.quitarItem(), buscar(), RL.reparar() (+1 more)

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor.estado()` connect `Motor.estado` to `NarradorDirector.lua`, `NarradorContactos.lua`, `NarradorMotor.lua`, `NarradorMundo.lua`, `NarradorCampamentos.lua`, `NarradorKnox.lua`, `NarradorConversas.lua`, `NarradorDominios.lua`, `NarradorBandido.lua`, `NarradorPasajeros.lua`, `NarradorOcupaciones.lua`, `NarradorContactos.lua`, `NarradorLegendario.lua`, `S.pedirFavor`, `README.md`, `Mundo.posicion`, `Mundo.horas`, `Mundo.jugadores`, `NarradorPasajeros.lua`, `NarradorMotor.lua`, `NarradorEncuentros.lua`, `C.estado`, `NarradorMotorGrupos.lua`, `NarradorOcupaciones.lua`, `Mundo.log`, `NarradorConversacionServer.lua`, `Motor.cumple`, `Motor.publicar`, `S.comprar`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Are the 125 inferred relationships involving `Motor.estado()` (e.g. with `A.programar()` and `A.st()`) actually correct?**
  _`Motor.estado()` has 125 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorContactos.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.0943683409436834 - nodes in this community are weakly interconnected._
- **Why does `Defs.get()` connect `NarradorPasajeros.lua` to `NarradorDirector.lua`, `NarradorContactos.lua`, `NarradorMotor.lua`, `NarradorEncuentros.lua`, `NarradorPasajeros.lua`, `NarradorKnox.lua`, `NarradorConversacionServer.lua`, `Mundo.log`, `NarradorDefs.lua`, `Motor.estado`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Are the 109 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 109 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorMotor.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.09113300492610837 - nodes in this community are weakly interconnected._
- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorDirector.lua`, `NarradorContactos.lua`, `NarradorMotor.lua`, `NarradorMundo.lua`, `NarradorCampamentos.lua`, `NarradorKnox.lua`, `NarradorConversas.lua`, `NarradorDominios.lua`, `NarradorBandido.lua`, `NarradorPasajeros.lua`, `NarradorOcupaciones.lua`, `NarradorContactos.lua`, `NarradorLegendario.lua`, `S.pedirFavor`, `Motor.estado`, `README.md`, `Mundo.posicion`, `Mundo.jugadores`, `NarradorPasajeros.lua`, `NarradorMotor.lua`, `NarradorEncuentros.lua`, `C.estado`, `NarradorMotorGrupos.lua`, `NarradorOcupaciones.lua`, `Mundo.log`, `Motor.cumple`, `Motor.publicar`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._