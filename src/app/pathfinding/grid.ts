import { BehaviorSubject } from 'rxjs';
import { Node, NodeType, AlgorithmOperation, Path, Nodes } from '../models';
import { getAlgorithm } from '../pathfinding/algorithms';
import { getMaze } from '../pathfinding/mazes';

export class Grid {
  private readonly _nodes = new BehaviorSubject<Node[]>([]);
  private readonly _updatedNode = new BehaviorSubject<Node>(undefined);

  readonly nodes$ = this._nodes.asObservable();
  readonly updatedNode$ = this._updatedNode.asObservable();

  start: string;
  target: string;

  width: number;
  height: number;
  nodeSize: number;

  generateNodes(width: number, height: number, nodeSize: number) {
    // this.nodes = new Array(this.height);
    this.width = width;
    this.height = height;
    this.nodeSize = nodeSize;

    const nodes: Node[] = [];

    let index = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const id = `${y}-${x}`;
        const type = this.getNodeType(x, y);

        nodes[index] = {
          id,
          x,
          y,
          type,
        };

        if (type === NodeType.START) {
          this.start = id;
        } else if (type === NodeType.TARGET) {
          this.target = id;
        }

        index++;
      }
    }

    this.nodes = nodes;
  }

  findPath(algorithmId: string): { path: Path; operations: AlgorithmOperation[] } {
    const algorithm = getAlgorithm(algorithmId);
    const operations: AlgorithmOperation[] = [];

    const path = algorithm.fn(this, {
      opened: ({ x, y }) => {
        /*if (!operations.find((operation) => operation.x === x && operation.y === y && operation.status === 'opened')) {
          operations.push({
            x,
            y,
            status: 'opened',
          });
        }*/
      },
      closed: ({ x, y }, i) => {
        operations.push({
          x,
          y,
          status: 'closed',
        });
      },
    });

    return { path, operations: [...new Set(operations)] };
  }

  generateMaze(mazeId: string) {
    const nodes = getMaze(mazeId).generate(this);
    if (!nodes) {
      this.resetNodes(({ type }) => ({ type: type === NodeType.WALL ? NodeType.DEFAULT : type }));
      return;
    }

    for (const { x, y } of nodes) {
      this.updateNode(x, y, { type: NodeType.WALL });
    }
  }

  get startNode() {
    return this.getNodeById(this.start);
  }

  get targetNode() {
    return this.getNodeById(this.target);
  }

  get nodes() {
    return this._nodes.getValue();
  }

  set nodes(nodes: Node[]) {
    this._nodes.next(nodes);
  }

  getNode(x: number, y: number) {
    return this.getNodeById(`${y}-${x}`);
  }

  getNodeById(id: string) {
    return this.nodes.find((node) => node.id === id);
  }

  getNodeAt(x: number, y: number) {
    return this.getNode(Math.floor(x / this.nodeSize), Math.floor(y / this.nodeSize));
  }

  getNodeCoordinates(id: string) {
    const coordinates = id.split('-');
    return { x: +coordinates[1], y: +coordinates[0] };
  }

  setNodes(nodes: Node[]) {
    this.nodes = [...nodes];
  }

  updateNode(x: number, y: number, changes: Partial<Node>) {
    const node = this.getNodeById(`${y}-${x}`);
    if (node) {
      const index = this.nodes.indexOf(node);
      this.nodes[index] = {
        ...node,
        ...changes,
      };
      this.nodes = [...this.nodes];
      this._updatedNode.next(this.nodes[index]);
    }
  }

  resetNode(x: number, y: number, keep: Partial<Node>) {
    const node = this.getNodeById(`${y}-${x}`);
    if (node) {
      const index = this.nodes.indexOf(node);
      this.nodes[index] = {
        id: node.id,
        x: node.x,
        y: node.y,
        type: node.type,
        ...keep,
      };
      this.nodes = [...this.nodes];
      this._updatedNode.next(this.nodes[index]);
    }
  }

  resetNodes(keep?: (node: Node) => Partial<Node>) {
    const nodes: Node[] = [];
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      nodes[i] = {
        id: node.id,
        x: node.x,
        y: node.y,
        type: node.type,
        ...keep(node),
      };
      this._updatedNode.next(nodes[i]);
    }

    this.nodes = [...nodes];
  }

  isWalkable(x: number, y: number) {
    return this.isInside(x, y) && this.getNode(x, y).type !== NodeType.WALL;
  }

  isInside(x: number, y: number) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getNeighbors(node: Node): Node[] {
    const { x, y } = node;
    const neighbors: Node[] = [];

    if (this.isWalkable(x, y - 1)) {
      neighbors.push(this.getNode(x, y - 1));
    }

    if (this.isWalkable(x + 1, y)) {
      neighbors.push(this.getNode(x + 1, y));
    }

    if (this.isWalkable(x, y + 1)) {
      neighbors.push(this.getNode(x, y + 1));
    }

    if (this.isWalkable(x - 1, y)) {
      neighbors.push(this.getNode(x - 1, y));
    }

    return neighbors;
  }

  setStartNode({ x, y }: Node) {
    this.start = `${y}-${x}`;
  }

  setTargetNode({ x, y }: Node) {
    this.target = `${y}-${x}`;
  }

  private getNodeType(x: number, y: number) {
    if (y === Math.floor(this.height / 2) && x === Math.floor(this.width / 4)) {
      console.log('dad');

      return NodeType.START;
    } else if (y === Math.floor(this.height / 2) && x === Math.floor((3 * this.width) / 4)) {
      return NodeType.TARGET;
    }

    return NodeType.DEFAULT;
  }
}

/* import { Node, NodeType, AlgorithmOperation, Path, Nodes } from '../models';
import { getAlgorithm } from './algorithms';
import { getMaze } from './mazes';

export class Grid {
  nodes: Nodes;
  start: string;
  target: string;

  constructor(public width: number, public height: number, public nodeSize: number) {}

  build() {
    // this.nodes = new Array(this.height);
    this.nodes = {};

    for (let y = 0; y < this.height; y++) {
      // this.nodes[y] = new Array<Node>(this.width);
      for (let x = 0; x < this.width; x++) {
        const id = `${y}-${x}`;
        const type = this.getNodeType(x, y);

        this.nodes[id] = {
          id,
          x,
          y,
          type,
        };

        if (type === NodeType.START) {
          this.start = id;
        } else if (type === NodeType.TARGET) {
          this.target = id;
        }
      }
    }
  }

  findPath(algorithmId: string): { path: Path; operations: AlgorithmOperation[] } {
    const algorithm = getAlgorithm(algorithmId);
    const operations: AlgorithmOperation[] = [];

    const path = algorithm.fn(this, {
      opened: ({ x, y }, i) => {
        operations.push({
          x,
          y,
          status: 'opened',
        });
      },
      closed: ({ x, y }, i) => {
        operations.push({
          x,
          y,
          status: 'closed',
        });
      },
    });

    return { path, operations };
  }

  generateMaze(mazeId: string) {
    const maze = getMaze(mazeId);
    maze.generate(this);
  }

  reset() {
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        const { id, x: nodeX, y: nodeY, type } = this.getNode(j, i);
        this.nodes[`${i}-${j}`] = {
          id,
          x: nodeX,
          y: nodeY,
          type: type === NodeType.START || type === NodeType.TARGET ? type : NodeType.DEFAULT,
        };
      }
    }
  }

  resetWalls() {
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        const { id, x, y, type, isPath, status } = this.getNode(j, i);
        this.nodes[`${y}-${x}`] = {
          id,
          x,
          y,
          type: type !== NodeType.WALL ? type : NodeType.DEFAULT,
          isPath,
          status,
        };
      }
    }
  }

  resetPath() {
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        const { id, x, y, type } = this.getNode(j, i);
        this.nodes[`${i}-${j}`] = {
          id,
          x,
          y,
          type,
          isPath: false,
        };
      }
    }
  }

  get startNode() {
    return this.getNodeById(this.start);
  }

  get targetNode() {
    return this.getNodeById(this.target);
  }

  getNode(x: number, y: number) {
    return this.nodes[`${y}-${x}`];
  }

  getNodeById(id: string) {
    const coordinates = id.split('-');
    return this.getNode(+coordinates[1], +coordinates[0]);
  }

  getNodeAt(x: number, y: number) {
    return this.getNode(Math.floor(x / this.nodeSize), Math.floor(y / this.nodeSize));
  }

  getNodeCoordinates(id: string) {
    const coordinates = id.split('-');
    return { x: +coordinates[1], y: +coordinates[0] };
  }

  updateNode(x: number, y: number, changes: Partial<Node>) {
    this.nodes[`${y}-${x}`] = { ...this.nodes[`${y}-${x}`], ...changes };
  }

  isWalkable(x: number, y: number) {
    return this.isInside(x, y) && this.getNode(x, y).type !== NodeType.WALL;
  }

  isInside(x: number, y: number) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getNeighbors(node: Node): Node[] {
    const { x, y } = node;
    const neighbors: Node[] = [];

    if (this.isWalkable(x, y - 1)) {
      neighbors.push(this.getNode(x, y - 1));
    }

    if (this.isWalkable(x + 1, y)) {
      neighbors.push(this.getNode(x + 1, y));
    }

    if (this.isWalkable(x, y + 1)) {
      neighbors.push(this.getNode(x, y + 1));
    }

    if (this.isWalkable(x - 1, y)) {
      neighbors.push(this.getNode(x - 1, y));
    }

    return neighbors;
  }

  setStartNode({ x, y }: Node) {
    this.start = `${y}-${x}`;
  }

  setTargetNode({ x, y }: Node) {
    this.target = `${y}-${x}`;
  }

  private getNodeType(x: number, y: number) {
    if (y === Math.floor(this.height / 2) && x === Math.floor(this.width / 4)) {
      console.log('dad');

      return NodeType.START;
    } else if (y === Math.floor(this.height / 2) && x === Math.floor((3 * this.width) / 4)) {
      return NodeType.TARGET;
    }

    return NodeType.DEFAULT;
  }
}
*/
