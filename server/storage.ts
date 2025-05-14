import { 
  users, type User, type InsertUser,
  connections, type Connection, type InsertConnection,
  dataSources, type DataSource, type InsertDataSource,
  pipelines, type Pipeline, type InsertPipeline,
  pipelineDataSources, type PipelineDataSource, type InsertPipelineDataSource,
  activities, type Activity, type InsertActivity
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Connection operations
  getConnections(userId: number): Promise<Connection[]>;
  getConnection(id: number): Promise<Connection | undefined>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnection(id: number, updates: Partial<Connection>): Promise<Connection | undefined>;
  deleteConnection(id: number): Promise<boolean>;
  
  // Data source operations
  getDataSources(connectionId: number): Promise<DataSource[]>;
  getDataSource(id: number): Promise<DataSource | undefined>;
  createDataSource(dataSource: InsertDataSource): Promise<DataSource>;
  updateDataSource(id: number, updates: Partial<DataSource>): Promise<DataSource | undefined>;
  deleteDataSource(id: number): Promise<boolean>;
  
  // Pipeline operations
  getPipelines(userId: number): Promise<Pipeline[]>;
  getPipeline(id: number): Promise<Pipeline | undefined>;
  createPipeline(pipeline: InsertPipeline): Promise<Pipeline>;
  updatePipeline(id: number, updates: Partial<Pipeline>): Promise<Pipeline | undefined>;
  deletePipeline(id: number): Promise<boolean>;
  
  // Pipeline Data Source link operations
  getPipelineDataSources(pipelineId: number): Promise<PipelineDataSource[]>;
  addDataSourceToPipeline(linkage: InsertPipelineDataSource): Promise<PipelineDataSource>;
  removeDataSourceFromPipeline(pipelineId: number, dataSourceId: number): Promise<boolean>;
  
  // Activity operations
  getActivities(userId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private connections: Map<number, Connection>;
  private dataSources: Map<number, DataSource>;
  private pipelines: Map<number, Pipeline>;
  private pipelineDataSources: Map<number, PipelineDataSource>;
  private activities: Map<number, Activity>;
  
  private userId: number;
  private connectionId: number;
  private dataSourceId: number;
  private pipelineId: number;
  private pipelineDataSourceId: number;
  private activityId: number;
  
  constructor() {
    this.users = new Map();
    this.connections = new Map();
    this.dataSources = new Map();
    this.pipelines = new Map();
    this.pipelineDataSources = new Map();
    this.activities = new Map();
    
    this.userId = 1;
    this.connectionId = 1;
    this.dataSourceId = 1;
    this.pipelineId = 1;
    this.pipelineDataSourceId = 1;
    this.activityId = 1;
    
    // Create default user
    this.createUser({
      username: "demo",
      password: "password123", // In a real app, this would be hashed
      displayName: "Demo User",
      email: "demo@example.com"
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id 
    };
    this.users.set(id, user);
    return user;
  }
  
  // Connection operations
  async getConnections(userId: number): Promise<Connection[]> {
    return Array.from(this.connections.values()).filter(
      (conn) => conn.userId === userId
    );
  }
  
  async getConnection(id: number): Promise<Connection | undefined> {
    return this.connections.get(id);
  }
  
  async createConnection(connection: InsertConnection): Promise<Connection> {
    const id = this.connectionId++;
    const now = new Date();
    const newConnection: Connection = {
      ...connection,
      id,
      createdAt: now,
      lastSyncedAt: null
    };
    this.connections.set(id, newConnection);
    
    // Add activity
    this.createActivity({
      userId: connection.userId,
      type: "connection_created",
      description: `Connected to ${connection.service}`,
      metadata: { connectionId: id, service: connection.service }
    });
    
    return newConnection;
  }
  
  async updateConnection(id: number, updates: Partial<Connection>): Promise<Connection | undefined> {
    const connection = this.connections.get(id);
    if (!connection) return undefined;
    
    const updatedConnection: Connection = {
      ...connection,
      ...updates
    };
    this.connections.set(id, updatedConnection);
    
    // Add activity
    if (updates.active !== undefined) {
      this.createActivity({
        userId: connection.userId,
        type: "connection_updated",
        description: updates.active 
          ? `Activated ${connection.service} connection` 
          : `Deactivated ${connection.service} connection`,
        metadata: { connectionId: id, service: connection.service }
      });
    }
    
    return updatedConnection;
  }
  
  async deleteConnection(id: number): Promise<boolean> {
    const connection = this.connections.get(id);
    if (!connection) return false;
    
    this.connections.delete(id);
    
    // Delete related data sources
    const dataSources = Array.from(this.dataSources.values())
      .filter(ds => ds.connectionId === id);
    
    for (const ds of dataSources) {
      this.deleteDataSource(ds.id);
    }
    
    return true;
  }
  
  // Data source operations
  async getDataSources(connectionId: number): Promise<DataSource[]> {
    return Array.from(this.dataSources.values()).filter(
      (ds) => ds.connectionId === connectionId
    );
  }
  
  async getDataSource(id: number): Promise<DataSource | undefined> {
    return this.dataSources.get(id);
  }
  
  async createDataSource(dataSource: InsertDataSource): Promise<DataSource> {
    const id = this.dataSourceId++;
    const now = new Date();
    const newDataSource: DataSource = {
      ...dataSource,
      id,
      createdAt: now
    };
    this.dataSources.set(id, newDataSource);
    
    // Get connection to determine user
    const connection = this.connections.get(dataSource.connectionId);
    if (connection) {
      this.createActivity({
        userId: connection.userId,
        type: "data_sync",
        description: `Added ${dataSource.name} data source`,
        metadata: { dataSourceId: id, connectionId: dataSource.connectionId }
      });
    }
    
    return newDataSource;
  }
  
  async updateDataSource(id: number, updates: Partial<DataSource>): Promise<DataSource | undefined> {
    const dataSource = this.dataSources.get(id);
    if (!dataSource) return undefined;
    
    const updatedDataSource: DataSource = {
      ...dataSource,
      ...updates
    };
    this.dataSources.set(id, updatedDataSource);
    return updatedDataSource;
  }
  
  async deleteDataSource(id: number): Promise<boolean> {
    const dataSource = this.dataSources.get(id);
    if (!dataSource) return false;
    
    this.dataSources.delete(id);
    
    // Remove from pipelines
    const links = Array.from(this.pipelineDataSources.values())
      .filter(link => link.dataSourceId === id);
    
    for (const link of links) {
      this.pipelineDataSources.delete(link.id);
    }
    
    return true;
  }
  
  // Pipeline operations
  async getPipelines(userId: number): Promise<Pipeline[]> {
    return Array.from(this.pipelines.values()).filter(
      (p) => p.userId === userId
    );
  }
  
  async getPipeline(id: number): Promise<Pipeline | undefined> {
    return this.pipelines.get(id);
  }
  
  async createPipeline(pipeline: InsertPipeline): Promise<Pipeline> {
    const id = this.pipelineId++;
    const now = new Date();
    const newPipeline: Pipeline = {
      ...pipeline,
      id,
      createdAt: now
    };
    this.pipelines.set(id, newPipeline);
    
    // Add activity
    this.createActivity({
      userId: pipeline.userId,
      type: "pipeline_created",
      description: `Created pipeline: ${pipeline.name}`,
      metadata: { pipelineId: id }
    });
    
    return newPipeline;
  }
  
  async updatePipeline(id: number, updates: Partial<Pipeline>): Promise<Pipeline | undefined> {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) return undefined;
    
    const updatedPipeline: Pipeline = {
      ...pipeline,
      ...updates
    };
    this.pipelines.set(id, updatedPipeline);
    
    // Add activity
    if (updates.active !== undefined) {
      this.createActivity({
        userId: pipeline.userId,
        type: "pipeline_updated",
        description: updates.active 
          ? `Activated pipeline: ${pipeline.name}` 
          : `Deactivated pipeline: ${pipeline.name}`,
        metadata: { pipelineId: id }
      });
    }
    
    return updatedPipeline;
  }
  
  async deletePipeline(id: number): Promise<boolean> {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) return false;
    
    this.pipelines.delete(id);
    
    // Remove data source links
    const links = Array.from(this.pipelineDataSources.values())
      .filter(link => link.pipelineId === id);
    
    for (const link of links) {
      this.pipelineDataSources.delete(link.id);
    }
    
    // Add activity
    this.createActivity({
      userId: pipeline.userId,
      type: "pipeline_deleted",
      description: `Deleted pipeline: ${pipeline.name}`,
      metadata: { pipelineId: id }
    });
    
    return true;
  }
  
  // Pipeline Data Source link operations
  async getPipelineDataSources(pipelineId: number): Promise<PipelineDataSource[]> {
    return Array.from(this.pipelineDataSources.values()).filter(
      (link) => link.pipelineId === pipelineId
    );
  }
  
  async addDataSourceToPipeline(linkage: InsertPipelineDataSource): Promise<PipelineDataSource> {
    const id = this.pipelineDataSourceId++;
    const newLink: PipelineDataSource = {
      ...linkage,
      id
    };
    this.pipelineDataSources.set(id, newLink);
    return newLink;
  }
  
  async removeDataSourceFromPipeline(pipelineId: number, dataSourceId: number): Promise<boolean> {
    const link = Array.from(this.pipelineDataSources.values()).find(
      (link) => link.pipelineId === pipelineId && link.dataSourceId === dataSourceId
    );
    
    if (!link) return false;
    
    this.pipelineDataSources.delete(link.id);
    return true;
  }
  
  // Activity operations
  async getActivities(userId: number, limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (limit) {
      return activities.slice(0, limit);
    }
    
    return activities;
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const now = new Date();
    const newActivity: Activity = {
      ...activity,
      id,
      createdAt: now
    };
    this.activities.set(id, newActivity);
    return newActivity;
  }
}

// Export a singleton instance
export const storage = new MemStorage();
