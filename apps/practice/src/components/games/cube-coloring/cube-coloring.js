import { mapActions, mapState } from 'pinia';
import GameSidebar from '../../common/game-sidebar/game-sidebar';
import GameRule from '../../common/game-rule/game-rule';
import { getGameStateAfterMove, isAllowedStep, allColors } from './strategy/strategy';
import { useGameStore } from '../../../stores/game';

export default {
  name: 'cube-coloring',
  template: require('./cube-coloring.html'),
  components: { GameSidebar, GameRule },
  computed: {
    ...mapState(useGameStore, ['board', 'shouldPlayerMoveNext']),
    allColors: () => allColors,
    cubeCoords: () => ([
      { cx: '8%',  cy: '25%' },
      { cx: '74%', cy: '25%' },
      { cx: '74%', cy: '91%' },
      { cx: '8%',  cy: '91%' },
      { cx: '25%', cy: '8%' },
      { cx: '91%', cy: '8%' },
      { cx: '91%', cy: '74%' },
      { cx: '25%', cy: '74%' }
    ])
  },
  data() {
    return {
      color: '',
      show: false,
      x: 0,
      y: 0
    };
  },
  methods: {
    ...mapActions(useGameStore, ['endPlayerTurn', 'initializeGame']),
    isMoveAllowed(vertex) {
      if (!this.shouldPlayerMoveNext) return false;
      if (!this.show) return false;
      return isAllowedStep(this.board, vertex, this.color);
    },
    pick(color) {
      if (!this.shouldPlayerMoveNext) return;
      if (this.color === color) {
        this.show = !this.show;
      } else {
        this.show = true;
        this.color = color;
      }
    },
    drawPickedColor(event) {
      this.x = event.offsetX;
      this.y = event.offsetY;
    },
    setColor(vertex) {
      if (!this.isMoveAllowed(vertex)) return;
      this.board[vertex] = this.color;
      this.show = false;
      this.endPlayerTurn(getGameStateAfterMove(this.board));
    },
    resetTurnState() {
      this.color = '';
      this.show = false;
    }
  },
  created() {
    this.initializeGame('CubeColoring');
  }
};
