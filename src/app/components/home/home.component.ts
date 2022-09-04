import { Component } from '@angular/core';
import { AngularFirestore, QuerySnapshot, QueryDocumentSnapshot } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/auth.service';
import { User } from 'src/app/models/user';
import { map, BehaviorSubject, combineLatest } from 'rxjs';
import { Todo } from 'src/app/models/todo';
import { BreakpointObserver } from '@angular/cdk/layout';

enum FilterState {
  ALL = 'All',
  ACTIVE = 'Active',
  COMPLETED = 'Completed'
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  items$?: Observable<any[]>;
  filteredTodos$?: Observable<any[]>;
  totalActiveTodos = 0;
  user: User | null = null;
  FilterState = FilterState;
  activeFilter: BehaviorSubject<FilterState> = new BehaviorSubject<FilterState>(FilterState.ALL);
  isSmallScreen = false;

  constructor(
    private firestore: AngularFirestore,
    private auth: AuthService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.auth.user$.subscribe((user: User | null) => {
      if(user){
        this.user = user;
        this.items$ = firestore.collection('todos', ref => ref.where('userId', '==', user.uid))
                      .valueChanges({idField: 'id'});
        this.items$
            .pipe(
              map((items: Todo[]) => items.filter(item => !item.isCompleted).length)
            )
            .subscribe((totalActiveTodos: number) => {
              this.totalActiveTodos = totalActiveTodos;
            });
        this.getTodos();
      }
    });
    this.isSmallScreen = breakpointObserver.isMatched('(max-width: 375px)');
    
   }

   isFilterActive(filterState: FilterState){
     return this.activeFilter.getValue() === filterState;
   }

   getTodos(){
     if(!this.items$){
       return;
     }

    this.filteredTodos$ = combineLatest(this.items$, this.activeFilter)
      .pipe(
        map(([todos, currentFilter]: [Todo[], FilterState]) => {
          if(currentFilter === FilterState.ALL){
            return todos;
          }
          return todos.filter((todo: Todo) => {
            const filterCondition = currentFilter === FilterState.COMPLETED ? true : false;
            return todo.isCompleted === filterCondition;
          });
        })
      );
   }


  setFilterState(filterState: FilterState){
    this.activeFilter.next(filterState);
  }

  clearCompleted(){
    if(this.user && this.items$){
      this.firestore
        .collection<Todo>('todos', ref => ref
          .where('userId', '==', this.user?.uid)
          .where('isCompleted', '==', true)
      )
      .get()
      .pipe(
        map((qs: QuerySnapshot<Todo>) => {
          return qs.docs;
        })
      )
      .subscribe((docs: QueryDocumentSnapshot<Todo>[]) => {
        docs.forEach((doc: QueryDocumentSnapshot<Todo>) => {
          doc.ref.delete();
        });
      });
    }
  }

  setAsCompleted(todo: Todo){
    const todoDoc = this.firestore.doc(`todos/${todo.id}`);
    todoDoc.update({
      isCompleted: true
    });
  }

  deleteTodo(todo:Todo){
    const todoDoc = this.firestore.doc(`todos/${todo.id}`);
    todoDoc.delete();
  }

}
