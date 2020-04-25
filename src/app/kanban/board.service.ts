import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';
import { switchMap, map, switchMapTo } from 'rxjs/operators';
import { Board, Task } from './board.model';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  constructor(private afAuth: AngularFireAuth, private db: AngularFirestore) {}

  // creates a new board for the current user
  async createBoard(data: Board) {
    const user = await this.afAuth.currentUser;

    return this.db.collection('boards').add({
      ...data,
      uid: user.uid,
      tasks: [{ description: 'Hello', label: 'yellow' }],
    });
  }

  // delete a board
  deleteBoard(boardId: string) {
    return this.db.collection('boards').doc(boardId).delete();
  }

  // update the task on board
  updateTasks(boardId: string, tasks: Task[]) {
    return this.db.collection('boards').doc(boardId).update({ tasks });
  }

  // remove a specific task from a board
  removeTask(boardId: string, task: Task) {
    return this.db
      .collection('boards')
      .doc(boardId)
      .update({
        tasks: firebase.firestore.FieldValue.arrayRemove(task),
      });
  }

  // get all boards owned by current user
  getUserBoards() {
    return this.afAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          return this.db
            .collection<Board>('boards', (ref) =>
              ref.where('uid', '==', user.uid).orderBy('priority')
            )
            .valueChanges({ idField: 'id' });
        } else {
          return [];
        }
      })
    );
  }

  // run a batch write to change the prioity of each board for sorting

  sortBoards(boards: Board[]) {
    const db = firebase.firestore();
    const batch = db.batch();
    const refs = boards.map((b) => db.collection('boards').doc(b.id));
    refs.forEach((ref, idx) => batch.update(ref, { prioity: idx }));
    batch.commit();
  }
}
